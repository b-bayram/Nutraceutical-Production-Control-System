import React, { useState, useRef, useEffect } from 'react';
import './Layout.css';
import TopBar from './TopBar';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const sidebarRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      // Ignore clicks on the menu button
      if (event.target.closest('button[aria-label="menu"]')) {
        return;
      }
      
      if (sidebarRef.current && 
          !sidebarRef.current.contains(event.target)) {
        setSidebarOpen(false);
      }
    }
  
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="layout">
      <TopBar onMenuClick={() => setSidebarOpen(!isSidebarOpen)} />
      <div ref={sidebarRef}>
        <Sidebar isOpen={isSidebarOpen} />
      </div>
      <main className={`main-content ${!isSidebarOpen ? 'expanded' : ''}`}>
        {children}
      </main>
    </div>
  );
}

export default Layout;