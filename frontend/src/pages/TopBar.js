import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Settings, 
  LogOut, 
  Menu,
  Plus
} from 'lucide-react';
import { API_URL } from '../config';

const TopBar = ({ onMenuClick, menuButtonRef }) => {
  const navigate = useNavigate();
  const [isProfileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <div className="bg-white border-b border-gray-200 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Sol Bölüm - Logo ve Menü */}
          <div className="flex items-center">
            <button
              ref={menuButtonRef}
              aria-label="menu"
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              onClick={onMenuClick}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="ml-4 font-semibold text-lg text-gray-800">
              Nutraceutical Production Control System
            </div>
          </div>

          {/* Sağ Bölüm - Actions */}
          <div className="flex items-center space-x-4">
            {/* Quick Actions */}
            <div className="relative">
              <button 
                onClick={() => navigate('/production-queue')}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                title="Start New Production"
              >
                <Plus className="h-6 w-6" />
              </button>
            </div>

            {/* Profil */}
            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setProfileOpen(!isProfileOpen)}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              >
                <User className="h-6 w-6" />
              </button>

              {/* Profil Dropdown */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                  <button 
                    onClick={() => navigate('/settings')}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 flex items-center"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;