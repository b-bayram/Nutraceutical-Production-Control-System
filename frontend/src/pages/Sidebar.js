import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home,
  Package,
  Box,
  ClipboardList,
  Users,
  Settings,
  BarChart2,
  Truck,
  AlertCircle,
} from 'lucide-react';

const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  
  const menuItems = [
    {
      title: 'Ana Sayfa',
      icon: <Home size={20} />,
      path: '/',
    },
    {
      title: 'Ürünler',
      icon: <Package size={20} />,
      path: '/products',
    },
    {
      title: 'Hammaddeler',
      icon: <Box size={20} />,
      path: '/raw-materials',
    },
    {
      title: 'Üretim Sırası',
      icon: <ClipboardList size={20} />,
      path: '/production-queue',
    },
    {
      title: 'Tedarikçiler',
      icon: <Truck size={20} />,
      path: '/suppliers',
    },
    {
      title: 'Raporlar',
      icon: <BarChart2 size={20} />,
      path: '/reports',
    },
    {
      title: 'Kullanıcılar',
      icon: <Users size={20} />,
      path: '/users',
    }
  ];

  return (
    <div className={`sidebar ${!isOpen ? 'closed' : ''}`}>
      <div className="px-3 py-4">
        {/* Logo veya Marka Alanı */}
        <div className="mb-8 px-2">
          <h1 className="text-xl font-bold text-white">İlaç Üretim</h1>
          <p className="text-sm text-blue-200 mt-1">Envanter Yönetimi</p>
        </div>

        {/* Ana Menü */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-2 py-3 rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-white bg-opacity-10 text-white' 
                    : 'text-blue-100 hover:bg-white hover:bg-opacity-5'
                  }`}
              >
                <span className="inline-flex items-center justify-center mr-3">
                  {item.icon}
                </span>
                <span className="font-medium">{item.title}</span>
                {item.alert && (
                  <span className="ml-auto bg-red-400 text-white text-xs px-2 py-1 rounded-full">
                    {item.alert}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Alt Bölüm - Ayarlar ve Yardım */}
        <div className="mt-8 border-t border-blue-400 border-opacity-30 pt-4">
          <Link
            to="/settings"
            className="flex items-center px-2 py-3 text-blue-100 rounded-lg hover:bg-white hover:bg-opacity-5 transition-all duration-200"
          >
            <span className="inline-flex items-center justify-center mr-3">
              <Settings size={20} />
            </span>
            <span className="font-medium">Ayarlar</span>
          </Link>
          <Link
            to="/help"
            className="flex items-center px-2 py-3 text-blue-100 rounded-lg hover:bg-white hover:bg-opacity-5 transition-all duration-200"
          >
            <span className="inline-flex items-center justify-center mr-3">
              <AlertCircle size={20} />
            </span>
            <span className="font-medium">Yardım</span>
          </Link>
        </div>

        {/* Kullanıcı Profili */}
        <div className="mt-8 px-2">
          <div className="flex items-center p-2 rounded-lg bg-white bg-opacity-5">
            <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center text-white font-semibold">
              AK
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">Admin Kullanıcı</p>
              <p className="text-xs text-blue-200">admin@example.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;