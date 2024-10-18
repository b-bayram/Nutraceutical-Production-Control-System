// src/components/Layout.js
import React, { useState } from 'react';
import './Layout.css';

const Layout = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="layout">
      {/* Top Bar */}
      <header className="top-bar">
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          ☰ {/* Hamburger icon */}
        </button>
        <h1>Nutraceutical Production Control System</h1>
      </header>

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <button className="close-button" onClick={toggleSidebar}>
          × {/* Close icon */}
        </button>
        <nav>
          <ul>
            <li><button>Option 1</button></li>
            <li><button>Option 2</button></li>
            <li><button>Option 3</button></li>
            <li><button>Option 4</button></li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {children} {/* This will render the current page content */}
      </main>
    </div>
  );
};

export default Layout;
