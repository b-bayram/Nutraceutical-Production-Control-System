import React from 'react';
import { NavLink } from 'react-router-dom';
import { Package, ClipboardList, Settings, HelpCircle } from 'lucide-react';

const Sidebar = () => {
  const getLinkClass = ({ isActive }) => 
    `flex items-center space-x-2 px-4 py-2 rounded-lg ${
      isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
    }`;

  return (
    <div className="flex flex-col space-y-1">
      <NavLink to="/raw-materials" className={getLinkClass}>
        <Package className="h-5 w-5" />
        Raw Materials
      </NavLink>
      <NavLink to="/production-queue" className={getLinkClass}>
        <ClipboardList className="h-5 w-5" />
        Production Queue
      </NavLink>
      <NavLink to="/settings" className={getLinkClass}>
        <Settings className="h-5 w-5" />
        Settings
      </NavLink>
      <NavLink to="/help" className={getLinkClass}>
        <HelpCircle className="h-5 w-5" />
        Help and Support
      </NavLink>
    </div>
  );
};

export default Sidebar; 