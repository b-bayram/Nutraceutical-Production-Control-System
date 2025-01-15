import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './Layout.css';
import TopBar from './TopBar';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const location = useLocation();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);
  const menuButtonRef = useRef(null);

  // Sayfa yüklendiğinde ve route değiştiğinde sidebar'ı aç
  useEffect(() => {
    if (!isInitialized) {
      setSidebarOpen(true);
      setIsInitialized(true);
    }
  }, [isInitialized, location]);

  useEffect(() => {
    function handleClickOutside(event) {
      // Eğer sidebar zaten kapalıysa, işlem yapma
      if (!isSidebarOpen) return;

      // Menü butonuna tıklanmışsa işlem yapma
      if (menuButtonRef.current && menuButtonRef.current.contains(event.target)) {
        return;
      }
      
      // Sidebar dışına tıklanmışsa kapat
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setSidebarOpen(false);
      }
    }
  
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarOpen]);

  const handleMenuClick = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  // Sayfa yüklenene kadar loading göster
  if (!isInitialized) {
    return (
      <div className="layout">
        <TopBar onMenuClick={handleMenuClick} menuButtonRef={menuButtonRef} />
        <main className="main-content expanded">
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="layout">
      <TopBar onMenuClick={handleMenuClick} menuButtonRef={menuButtonRef} />
      <Sidebar isOpen={isSidebarOpen} ref={sidebarRef} />
      <main 
        className={`main-content ${!isSidebarOpen ? 'expanded' : ''}`}
        style={{ 
          transition: 'margin-left 0.3s ease-in-out',
          marginLeft: isSidebarOpen ? '280px' : '0'
        }}
      >
        {children}
      </main>
    </div>
  );
}

export default Layout;