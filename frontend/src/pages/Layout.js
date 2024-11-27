import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Layout.css';

const Layout = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="layout">
      <div className="top-bar">
        <button className="menu-toggle" onClick={toggleSidebar}>☰</button>
        <span>Welcome, Admin</span>
      </div>
      
      <nav className={`sidebar ${!isSidebarOpen ? 'closed' : ''}`}>
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/raw-materials">Raw Materials</Link></li>
          <li><Link to="/products">Products</Link></li>
          <li><Link to="/production-queue">Production Queue</Link></li>
          <li><Link to="/suppliers">Suppliers</Link></li>
          <li><Link to="/settings">Settings</Link></li>
        </ul>
      </nav>
      
      <main className={`main-content ${!isSidebarOpen ? 'expanded' : ''}`}>
        {children}
      </main>
    </div>
  );
}

export default Layout;