import React from 'react';
import ProductionCard from './ProductionCard';

const ProductionColumn = ({ title, productions, onStartProduction, onComplete, onViewDetails, onRefresh }) => {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg">{title}</h2>
        <span className="px-2 py-1 bg-gray-200 rounded-full text-sm">
          {productions.length}
        </span>
      </div>
      <div className="space-y-4 min-h-[200px]">
        {productions.map((production) => (
          <ProductionCard 
            key={production.id}
            production={production}
            onStartProduction={onStartProduction}
            onComplete={onComplete}
            onViewDetails={onViewDetails}
            onRefresh={onRefresh}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductionColumn; 