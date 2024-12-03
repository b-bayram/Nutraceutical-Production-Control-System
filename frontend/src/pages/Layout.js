import React, { useState } from 'react';
import './Layout.css';
import TopBar from './TopBar';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="layout">
      <TopBar onMenuClick={() => setSidebarOpen(!isSidebarOpen)} />
      <Sidebar isOpen={isSidebarOpen} />
      <main className={`main-content ${!isSidebarOpen ? 'expanded' : ''}`}>
        {children}
      </main>
    </div>
  );
}

export default Layout;