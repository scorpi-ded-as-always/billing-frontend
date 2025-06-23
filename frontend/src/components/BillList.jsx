import React, { useEffect, useState } from "react";

const BillList = () => {
  const [bills, setBills] = useState([]);
  const [search, setSearch] = useState("");
  const token = "Bearer MOCK_TOKEN";

  const fetchBills = async () => {
    const res = await fetch(`http://localhost:3000/bills?product=${search}`, {
      headers: { Authorization: token },
    });
    const data = await res.json();
    setBills(data.data || []);
  };

  useEffect(() => {
    fetchBills();
  }, [search]);

  const printBill = (id) => {
    window.open(`http://localhost:3000/print-bill/${id}`, "_blank");
  };

  const downloadPDF = (billId) => {
    fetch(`http://localhost:3000/download-pdf/${billId}`, {
      headers: { Authorization: token },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `invoice-${billId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      });
  };

  return (
    <div>
      <h2>🧾 All Bills</h2>

      <input
        placeholder="Search by product name"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: "10px", padding: "5px" }}
      />

      <table border="1" cellPadding="6" width="100%">
        <thead>
          <tr>
            <th>Bill ID</th>
            <th>Date</th>
            <th>Items</th>
            <th>Total</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {bills.map((bill) => (
            <tr key={bill.id}>
              <td>{bill.id}</td>
              <td>{new Date(bill.date).toLocaleString()}</td>
              <td>
                {bill.items.map((i) => (
                  <div key={i.id}>
                    {i.name} x{i.quantity}
                  </div>
                ))}
              </td>
              <td>₹{bill.total.toFixed(2)}</td>
              <td>
                <button onClick={() => printBill(bill.id)}>🖨️ Print</button>
                <button onClick={() => downloadPDF(bill.id)}>📥 PDF</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BillList;
