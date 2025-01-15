import React from 'react';
import { Mail, Phone } from 'lucide-react';

const HelpAndSupport = () => {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 mt-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 text-blue-900">Help & Support</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Welcome to the NPCS help center
        </p>
      </div>
      
      {/* About NPCS Section */}
      <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-md mb-8 border border-blue-100">
        <div className="p-8">
          <h2 className="text-2xl font-semibold mb-4 text-blue-900">What is NPCS?</h2>
          <p className="text-gray-700 leading-relaxed">
            NPCS (Nutraceutical Production Control System) is a comprehensive inventory and production tracking software 
            designed specifically for pharmacy companies. It streamlines the management of raw materials, 
            product recipes, and production processes while ensuring compliance with pharmaceutical standards.
            Our system helps you maintain accurate inventory levels, track batch numbers, and manage 
            production workflows efficiently.
          </p>
        </div>
      </div>

      {/* User Guide Section */}
      <div className="space-y-8">
        <h2 className="text-3xl font-semibold mb-6 text-blue-900">How to Use NPCS</h2>
        
        {/* Raw Materials Guide */}
        <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100">
          <div className="p-8">
            <h3 className="text-xl font-semibold mb-4 text-blue-800">Raw Materials Management</h3>
            <p className="text-gray-700 mb-4">
              In the Raw Materials page, you can:
            </p>
            <ul className="list-disc ml-6 space-y-3 text-gray-600">
              <li>Add new raw material types for your inventory</li>
              <li>Create and manage batches for each raw material type</li>
              <li>Track batch quantities and availability</li>
              <li>Remove raw material types that have no associated batches</li>
            </ul>
          </div>
        </div>

        {/* Products Guide */}
        <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100">
          <div className="p-8">
            <h3 className="text-xl font-semibold mb-4 text-blue-800">Products Management</h3>
            <p className="text-gray-700 mb-4">
              The Products page allows you to:
            </p>
            <ul className="list-disc ml-6 space-y-3 text-gray-600">
              <li>Create new product definitions with custom names</li>
              <li>Define product recipes by specifying required raw materials</li>
              <li>Manage existing product specifications</li>
              <li>Prepare products for production queue</li>
            </ul>
          </div>
        </div>

        {/* Production Queue Guide */}
        <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100">
          <div className="p-8">
            <h3 className="text-xl font-semibold mb-4 text-blue-800">Production Queue Management</h3>
            <p className="text-gray-700 mb-4">
              In the Production Queue page, you can:
            </p>
            <ul className="list-disc ml-6 space-y-3 text-gray-600">
              <li>Initiate new production orders by selecting products</li>
              <li>Choose specific raw material batches for production</li>
              <li>Track production status through three distinct states</li>
              <li>Complete productions and automatically update inventory levels</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="mt-16">
        <h2 className="text-3xl font-semibold mb-8 text-blue-900">Contact Support</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-md border border-blue-100">
            <div className="p-8">
              <div className="flex items-center space-x-4">
                <Mail className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="font-medium text-lg text-blue-900">Email Support</h3>
                  <p className="text-gray-600 mt-1">support@npcs.com</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-md border border-blue-100">
            <div className="p-8">
              <div className="flex items-center space-x-4">
                <Phone className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="font-medium text-lg text-blue-900">Phone Support</h3>
                  <p className="text-gray-600 mt-1">+0 00000000</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpAndSupport;