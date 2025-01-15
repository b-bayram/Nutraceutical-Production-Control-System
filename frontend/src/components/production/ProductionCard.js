import React, { useState } from 'react';
import { PRODUCTION_STAGES } from '../../constants';
import { productionAPI } from '../../services/api';
import { getStatusClass } from '../../utils';

const ProductionCard = ({ production, onStartProduction, onComplete, onViewDetails, onRefresh }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async () => {
    try {
      setIsLoading(true);
      await onStartProduction(production.id);
    } catch (error) {
      console.error('Error starting production:', error);
      alert('Failed to start production: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this production?')) return;
    try {
      await productionAPI.cancelProduction(production.id);
      await onRefresh();
    } catch (error) {
      console.error('Error canceling production:', error);
      alert('Failed to cancel production: ' + error.message);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-lg text-gray-800">
          {production.productName}
        </h3>
        <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(production.stage)}`}>
          {production.stage}
        </span>
      </div>
      
      <div className="space-y-2 text-sm text-gray-600">
        <div>Quantity: {production.quantity}</div>
        <div>Recipe v{production.recipeVersion}</div>
        <div>{new Date(production.startDate).toLocaleDateString()}</div>
      </div>

      <div className="flex justify-between items-center mt-4 pt-3 border-t">
        <button 
          onClick={() => onViewDetails(production.id)}
          className="text-gray-600 hover:text-gray-800 text-sm"
        >
          View Details
        </button>
        
        {production.stage === PRODUCTION_STAGES.PREPARATION && (
          <>
            <button 
              onClick={async () => {
                try {
                  await productionAPI.startProduction(production.id);
                  await onRefresh();
                } catch (error) {
                  console.error('Error starting production:', error);
                  alert('Failed to start production: ' + error.message);
                }
              }}
              className="text-blue-600 hover:text-blue-900"
            >
              Start
            </button>
            <button 
              onClick={handleCancel}
              className="text-red-600 hover:text-red-900"
            >
              Cancel
            </button>
          </>
        )}

        {production.stage === PRODUCTION_STAGES.PRODUCING && (
          <button 
            onClick={async () => {
              try {
                await productionAPI.completeProduction(production.id);
                await onRefresh();
              } catch (error) {
                console.error('Error completing production:', error);
                alert('Failed to complete production: ' + error.message);
              }
            }}
            className="text-green-600 hover:text-green-900"
          >
            Complete
          </button>
        )}

        {production.stage === PRODUCTION_STAGES.PRODUCED && (
          <button
            onClick={async () => {
              try {
                await productionAPI.sendProduction(production.id);
                await onRefresh();
              } catch (error) {
                console.error('Error sending production:', error);
                alert('Failed to send production: ' + error.message);
              }
            }}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md text-sm"
          >
            Mark as Sent
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductionCard; 