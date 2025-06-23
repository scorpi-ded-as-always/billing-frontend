import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import ProductForm from "./components/ProductForm";
import BillForm from "./components/BillForm";
import BillList from "./components/BillList";
import Login from "./pages/Login";

function App() {
  return (
    <Router>
      <div className="container">
        <h1>🧾 Billing & Stock Management</h1>

        <nav>
          <Link to="/">🏠 Bills</Link> |{" "}
          <Link to="/products">📦 Products</Link> |{" "}
          <Link to="/create">➕ Create Bill</Link>
        </nav>

        <Routes>
          <Route path="/" element={<BillList />} />
          <Route path="/products" element={<ProductForm />} />
          <Route path="/create" element={<BillForm />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
