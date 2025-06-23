import React, { useEffect, useState } from "react";

const BillForm = () => {
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);
  const [gst, setGst] = useState(18);
  const [discount, setDiscount] = useState(0);
  const token = "Bearer MOCK_TOKEN";

  useEffect(() => {
    fetch("http://localhost:3000/products")
      .then((res) => res.json())
      .then(setProducts);
  }, []);

  const addItem = (product) => {
    const existing = items.find((i) => i.id === product.id);
    if (existing) {
      existing.quantity += 1;
      setItems([...items]);
    } else {
      setItems([...items, { ...product, quantity: 1 }]);
    }
  };

  const updateQty = (id, qty) => {
    setItems(
      items.map((i) => (i.id === id ? { ...i, quantity: Number(qty) } : i))
    );
  };

  const removeItem = (id) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("http://localhost:3000/bills", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({ items, gst, discount }),
    });

    const data = await res.json();
    alert("Bill Created ✅");
    setItems([]);
  };

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const gstAmt = (subtotal * gst) / 100;
  const discountAmt = (subtotal * discount) / 100;
  const total = subtotal + gstAmt - discountAmt;

  return (
    <div>
      <h2>➕ Create Bill</h2>

      <div>
        <label>GST %: </label>
        <input
          type="number"
          value={gst}
          onChange={(e) => setGst(Number(e.target.value))}
        />
        &nbsp;&nbsp;
        <label>Discount %: </label>
        <input
          type="number"
          value={discount}
          onChange={(e) => setDiscount(Number(e.target.value))}
        />
      </div>

      <h3>📦 Available Products</h3>
      <ul>
        {products.map((p) => (
          <li key={p.id}>
            {p.name} - ₹{p.price} ({p.quantity} in stock)
            <button onClick={() => addItem(p)}>➕ Add</button>
          </li>
        ))}
      </ul>

      <h3>🛒 Bill Items</h3>
      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>Name</th><th>Qty</th><th>Price</th><th>Total</th><th>Remove</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id}>
              <td>{i.name}</td>
              <td>
                <input
                  type="number"
                  value={i.quantity}
                  min={1}
                  onChange={(e) => updateQty(i.id, e.target.value)}
                />
              </td>
              <td>₹{i.price}</td>
              <td>₹{(i.price * i.quantity).toFixed(2)}</td>
              <td><button onClick={() => removeItem(i.id)}>❌</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h4>Subtotal: ₹{subtotal.toFixed(2)}</h4>
      <h4>GST ({gst}%): ₹{gstAmt.toFixed(2)}</h4>
      <h4>Discount ({discount}%): -₹{discountAmt.toFixed(2)}</h4>
      <h2>Total: ₹{total.toFixed(2)}</h2>

      <button onClick={handleSubmit} disabled={items.length === 0}>
        🧾 Submit Bill
      </button>
    </div>
  );
};

export default BillForm;
