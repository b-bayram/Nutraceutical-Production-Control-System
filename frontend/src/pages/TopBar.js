import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  Search, 
  User, 
  Settings, 
  LogOut, 
  Menu,
  X,
  ChevronDown,
  Plus
} from 'lucide-react';

const TopBar = ({ onMenuClick }) => {
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [isNotificationOpen, setNotificationOpen] = useState(false);
  const [isProfileOpen, setProfileOpen] = useState(false);
  
  const notifications = [
    { id: 1, title: 'Yeni sipariş girişi', time: '5 dakika önce', isNew: true },
    { id: 2, title: 'Stok uyarısı', time: '1 saat önce', isNew: true },
    { id: 3, title: 'Teslimat tamamlandı', time: '3 saat önce', isNew: false }
  ];

  const quickActions = [
    { id: 1, title: 'Yeni Ürün Ekle', icon: 'plus' },
    { id: 2, title: 'Stok Girişi', icon: 'box' },
    { id: 3, title: 'Rapor Oluştur', icon: 'file' }
  ];

  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
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
    aria-label="menu"
    className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
    onClick={() => onMenuClick()}
  >
    <Menu className="h-6 w-6" />
  </button>
  <div className="ml-4 font-semibold text-lg text-gray-800">
    Nutraceutical Production Control System
  </div>
</div>

          {/* Orta Bölüm - Arama */}
          <div className="flex-1 max-w-2xl mx-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search"
                className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Sağ Bölüm - Actions */}
          <div className="flex items-center space-x-4">
            {/* Quick Actions */}
            <div className="relative">
              <button className="p-2 rounded-lg text-gray-600 hover:bg-gray-100">
                <Plus className="h-6 w-6" />
              </button>
            </div>

            {/* Bildirimler */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setNotificationOpen(!isNotificationOpen)}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 relative"
              >
                <Bell className="h-6 w-6" />
                {notifications.filter(n => n.isNew).length > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    {notifications.filter(n => n.isNew).length}
                  </span>
                )}
              </button>

              {/* Bildirim Dropdown */}
              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-800">Notifications</h3>
                  </div>
                  {notifications.map(notification => (
                    <div key={notification.id} className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm text-gray-800">{notification.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                        </div>
                        {notification.isNew && (
                          <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="px-4 py-2 border-t border-gray-200">
                    <button className="text-sm text-blue-600 hover:text-blue-800">
                      See All Notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profil */}
            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              >
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="h-5 w-5" />
                </div>
                <ChevronDown className="h-4 w-4" />
              </button>

              {/* Profil Dropdown */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                  <a href="#profile" className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    My Profile
                  </a>
                  <a href="#settings" className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </a>
                  <div className="border-t border-gray-200 my-1"></div>
                  <a href="#logout" className="px-4 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </a>
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