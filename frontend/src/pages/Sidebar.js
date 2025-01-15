import React, { forwardRef, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home,
  Package,
  Box,
  ClipboardList,
  AlertCircle
} from 'lucide-react';

const Sidebar = forwardRef(({ isOpen }, ref) => {
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const menuItems = [
    {
      title: 'Homepage',
      icon: <Home size={20} />,
      path: '/',
    },
    {
      title: 'Products',
      icon: <Package size={20} />,
      path: '/products',
    },
    {
      title: 'Raw Materials',
      icon: <Box size={20} />,
      path: '/raw-materials',
    },
    {
      title: 'Production Queue',
      icon: <ClipboardList size={20} />,
      path: '/production-queue',
    }
  ];

  return (
    <div ref={ref} className={`sidebar ${!isOpen ? 'closed' : ''}`}>
      <div className="px-4 py-6">
        {/* Logo ve Marka Alanı */}
        <div className="mb-8 px-2">
          <div className="flex items-center space-x-3">
            <div className="bg-white bg-opacity-10 p-2 rounded-xl">
              <h1 className="text-4xl font-bold text-white">N</h1>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">NPCS</h1>
              <p className="text-sm text-blue-200">Production Control</p>
            </div>
          </div>
        </div>

        {/* Ana Menü */}
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-3 rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-white bg-opacity-15 text-white shadow-lg' 
                    : 'text-blue-100 hover:bg-white hover:bg-opacity-10'
                  }`}
              >
                <span className={`inline-flex items-center justify-center mr-3 p-1 rounded-lg ${
                  isActive ? 'bg-white bg-opacity-20' : ''
                }`}>
                  {item.icon}
                </span>
                <span className="font-medium">{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* Alt Bölüm - Yardım */}
        <div className="mt-8 pt-6 border-t border-white border-opacity-10">
          <div className="space-y-2">
            <Link
              to="/help"
              className="flex items-center px-3 py-3 text-blue-100 rounded-xl hover:bg-white hover:bg-opacity-10 transition-all duration-200"
            >
              <span className="inline-flex items-center justify-center mr-3 p-1">
                <AlertCircle size={20} />
              </span>
              <span className="font-medium">Help and Support</span>
            </Link>
          </div>
        </div>

        {/* Kullanıcı Profili */}
        <div className="mt-8">
          <div className="flex items-center p-3 rounded-xl bg-white bg-opacity-10 hover:bg-opacity-15 transition-all duration-200 cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white font-semibold shadow-lg">
              {user?.fullName ? user.fullName[0].toUpperCase() : '?'}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{user?.fullName || 'Loading...'}</p>
              <p className="text-xs text-blue-200">{user?.email || ''}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;