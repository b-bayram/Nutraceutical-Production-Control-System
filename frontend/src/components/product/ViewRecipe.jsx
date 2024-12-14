// src/components/product/ViewRecipe.jsx
import React from 'react';
import { Button } from '../ui/button';

const ViewRecipe = ({ recipe, onClose, onStartProduction }) => {
  if (!recipe) return null;

  return (
    <div className="p-6 max-w-2xl w-full">
      <h2 className="text-2xl font-bold mb-4">Recipe Details</h2>
      
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <span className="font-medium">Version {recipe.version}</span>
          <span className={`px-2 py-1 rounded-full text-sm ${
            recipe.isActive 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {recipe.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Required Materials:</h3>
            <div className="space-y-2">
              {recipe.materials?.map((material, index) => (
                <div 
                  key={index} 
                  className="flex justify-between items-center p-2 bg-white rounded border"
                >
                  <span className="font-medium">{material.materialType.name}</span>
                  <span className="text-gray-600">{material.amount}g</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded">
            <h3 className="font-medium text-blue-800 mb-1">Production Notes:</h3>
            <p className="text-sm text-blue-600">
              All materials should be carefully measured according to the specified amounts.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <Button
          variant="outline"
          onClick={onClose}
        >
          Close
        </Button>
        <Button
          onClick={() => onStartProduction(recipe)}
        >
          Start Production
        </Button>
      </div>
    </div>
  );
};

export default ViewRecipe;