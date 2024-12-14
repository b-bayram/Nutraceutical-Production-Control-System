// src/components/ui/tabs.jsx
import React from 'react';

const Tabs = ({ defaultTab, children }) => {
 const [activeTab, setActiveTab] = React.useState(defaultTab);
 
 const tabs = React.Children.toArray(children).filter(
   child => child.type === TabPanel
 );

 const handleTabClick = (e, tabId) => {
   e.preventDefault();
   e.stopPropagation();
   setActiveTab(tabId);
 };

 return (
   <div className="w-full">
     <div className="border-b border-gray-200">
       <nav className="flex -mb-px">
         {tabs.map((tab) => (
           <button
             key={tab.props.id}
             onClick={(e) => handleTabClick(e, tab.props.id)}
             type="button" // Add this to prevent form submission
             className={`py-2 px-4 mr-2 text-sm font-medium ${
               activeTab === tab.props.id
                 ? 'border-b-2 border-blue-500 text-blue-600'
                 : 'text-gray-500 hover:text-gray-700'
             }`}
           >
             {tab.props.title}
           </button>
         ))}
       </nav>
     </div>
     <div className="mt-4">
       {tabs.find(tab => tab.props.id === activeTab)}
     </div>
   </div>
 );
};

const TabPanel = ({ children, id }) => {
 return <div>{children}</div>;
};

export { Tabs, TabPanel };