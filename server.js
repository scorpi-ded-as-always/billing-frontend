const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const app = express();
app.use(cors());
app.use(express.json());

// Helpers
const loadData = (filename) => {
  const filePath = path.join(__dirname, filename);
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify([]));
  return JSON.parse(fs.readFileSync(filePath));
};

const saveData = (filename, data) => {
  fs.writeFileSync(path.join(__dirname, filename), JSON.stringify(data, null, 2));
};

const isAuthenticated = (req, res, next) => {
  const token = req.headers.authorization;
  if (token === "Bearer MOCK_TOKEN") next();
  else res.status(401).send("Unauthorized");
};

// Products
app.get("/products", (req, res) => {
  const products = loadData("products.json");
  res.json(products);
});

app.post("/products", isAuthenticated, (req, res) => {
  const products = loadData("products.json");
  const newProduct = { id: Date.now().toString(), ...req.body };
  products.push(newProduct);
  saveData("products.json", products);
  res.json(newProduct);
});

app.put("/products/:id", isAuthenticated, (req, res) => {
  let products = loadData("products.json");
  products = products.map(p => p.id === req.params.id ? { ...p, ...req.body } : p);
  saveData("products.json", products);
  res.send("Product updated");
});

app.delete("/products/:id", isAuthenticated, (req, res) => {
  let products = loadData("products.json");
  products = products.filter(p => p.id !== req.params.id);
  saveData("products.json", products);
  res.send("Product deleted");
});

// Bills
app.post("/bills", isAuthenticated, (req, res) => {
  const { items, gst, discount } = req.body;
  let products = loadData("products.json");

  let subtotal = 0;
  items.forEach(item => {
    const product = products.find(p => p.id === item.id);
    if (product && product.quantity >= item.quantity) {
      subtotal += item.price * item.quantity;
      product.quantity -= item.quantity;
    }
  });

  saveData("products.json", products);

  const gstAmount = (subtotal * gst) / 100;
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal + gstAmount - discountAmount;

  const bills = loadData("bills.json");
  const bill = {
    id: Date.now().toString(),
    date: new Date().toISOString(),
    items,
    subtotal,
    gst,
    discount,
    total
  };
  bills.push(bill);
  saveData("bills.json", bills);
  res.json(bill);
});

app.get("/bills", isAuthenticated, (req, res) => {
  let bills = loadData("bills.json");
  const { page = 1, limit = 10, product } = req.query;

  if (product) {
    bills = bills.filter(b =>
      b.items.some(i => i.name.toLowerCase().includes(product.toLowerCase()))
    );
  }

  const start = (page - 1) * limit;
  const end = start + parseInt(limit);
  const paginatedBills = bills
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(start, end);

  res.json({ total: bills.length, page: +page, limit: +limit, data: paginatedBills });
});

// Print bill in browser
app.get("/print-bill/:id", isAuthenticated, (req, res) => {
  const bills = loadData("bills.json");
  const bill = bills.find(b => b.id === req.params.id);
  if (!bill) return res.status(404).send("Bill not found");

  const html = `
    <html>
      <head>
        <title>Invoice #${bill.id}</title>
        <style>
          body { font-family: Arial; padding: 20px; line-height: 1.6; }
          h1 { color: #333; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          th { background-color: #f4f4f4; }
          .total { font-size: 1.2em; font-weight: bold; margin-top: 20px; }
          .print-btn { margin-top: 20px; }
        </style>
      </head>
      <body>
        <h1>Invoice #${bill.id}</h1>
        <p><strong>Date:</strong> ${new Date(bill.date).toLocaleString()}</p>
        <table>
          <thead><tr><th>Product</th><th>Qty</th><th>Price</th></tr></thead>
          <tbody>
            ${bill.items.map(i => `<tr><td>${i.name}</td><td>${i.quantity}</td><td>₹${i.price.toFixed(2)}</td></tr>`).join("")}
          </tbody>
        </table>
        <p><strong>Subtotal:</strong> ₹${bill.subtotal.toFixed(2)}</p>
        <p><strong>GST (${bill.gst}%):</strong> ₹${((bill.subtotal * bill.gst) / 100).toFixed(2)}</p>
        <p><strong>Discount (${bill.discount}%):</strong> ₹${((bill.subtotal * bill.discount) / 100).toFixed(2)}</p>
        <div class="total">Total: ₹${bill.total.toFixed(2)}</div>
        <button class="print-btn" onclick="window.print()">🖨️ Print this Invoice</button>
      </body>
    </html>
  `;
  res.send(html);
});

// Download PDF
app.get("/download-pdf/:id", isAuthenticated, (req, res) => {
  const bills = loadData("bills.json");
  const bill = bills.find(b => b.id === req.params.id);
  if (!bill) return res.status(404).send("Bill not found");

  const doc = new PDFDocument();
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=invoice-${bill.id}.pdf`);
  doc.pipe(res);

  doc.fontSize(20).text(`Invoice #${bill.id}`, { align: "center" });
  doc.moveDown().fontSize(12).text(`Date: ${new Date(bill.date).toLocaleString()}`);
  doc.moveDown();
  doc.text("Items:");
  bill.items.forEach(i => {
    doc.text(`- ${i.name} x${i.quantity} @ ₹${i.price.toFixed(2)}`);
  });
  doc.moveDown();
  doc.text(`Subtotal: ₹${bill.subtotal.toFixed(2)}`);
  doc.text(`GST (${bill.gst}%): ₹${((bill.subtotal * bill.gst) / 100).toFixed(2)}`);
  doc.text(`Discount (${bill.discount}%): ₹${((bill.subtotal * bill.discount) / 100).toFixed(2)}`);
  doc.moveDown();
  doc.fontSize(14).text(`Total: ₹${bill.total.toFixed(2)}`, { bold: true });

  doc.end();
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
  console.log("Use /print-bill/:id to view printable invoices.");
});
