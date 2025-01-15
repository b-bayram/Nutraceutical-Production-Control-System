import React from 'react';

const ProductionDetailsModal = ({ production, onClose }) => (
  <div className="p-6">
    <h2 className="text-xl font-bold mb-4">Production Details</h2>
    <div className="space-y-4">
      <div>
        <label className="font-medium">Product Name:</label>
        <p>{production?.productName}</p>
      </div>
      <div>
        <label className="font-medium">Recipe Version:</label>
        <p>v{production?.recipeVersion}</p>
      </div>
      <div>
        <label className="font-medium">Quantity:</label>
        <p>{production?.quantity}</p>
      </div>
      <div>
        <label className="font-medium">Status:</label>
        <p>{production?.stage}</p>
      </div>
    </div>
    <div className="mt-6 flex justify-end">
      <button 
        onClick={onClose}
        className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md"
      >
        Close
      </button>
    </div>
  </div>
);

export default ProductionDetailsModal; 