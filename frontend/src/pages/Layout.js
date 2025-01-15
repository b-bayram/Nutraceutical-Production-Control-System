import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './Layout.css';
import TopBar from './TopBar';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const location = useLocation();
  const [isMounted, setIsMounted] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const sidebarRef = useRef(null);
  const menuButtonRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!isSidebarOpen) return;
      
      if (menuButtonRef.current && menuButtonRef.current.contains(event.target)) {
        return;
      }
      
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setSidebarOpen(false);
      }
    }
  
    document.addEventListener('pointerdown', handleClickOutside);
  
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [isSidebarOpen]);

  const handleMenuClick = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className={`layout ${isMounted ? 'mounted' : ''}`}>
      <div className="topbar">
        <TopBar onMenuClick={handleMenuClick} menuButtonRef={menuButtonRef} />
      </div>
      <Sidebar isOpen={isSidebarOpen} ref={sidebarRef} />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;