import { useState, useEffect } from 'react';
import axios from 'axios';

const BulkProductionModal = ({ onClose, onSuccess }) => {
  const [products, setProducts] = useState([]);
  const [selectedProductions, setSelectedProductions] = useState([{
    productId: '',
    templateId: '',
    quantity: 1,
    materials: [], // Will hold: { materialTypeId, materialName, batches[], selectedBatchId, amountNeeded }
    recipe: null
  }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/products');
      setProducts(response.data.data || []);
    } catch (error) {
      setError('Failed to load products');
    }
  };

  const fetchBatches = async (materialTypeId) => {
    try {
      const response = await axios.get(`http://localhost:5001/api/raw-materials/batches?typeId=${materialTypeId}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching batches:', error);
      return [];
    }
  };

  const handleProductChange = async (index, productId) => {
    if (!productId) return;

    try {
      setLoading(true);
      // Fetch recipe and material details
      const recipeResponse = await axios.get(`http://localhost:5001/api/products/${productId}/recipe`);
      const recipe = recipeResponse.data.data;
      if (!recipe) return;

      // For each material in recipe, fetch available batches
      const materialsWithBatches = await Promise.all(
        recipe.materials.map(async (material) => {
          const batches = await fetchBatches(material.materialType.id);
          return {
            materialTypeId: material.materialType.id,
            materialName: material.materialType.name,
            amountNeeded: material.amount,
            batches: batches,
            selectedBatchId: '',
          };
        })
      );

      const updatedProductions = [...selectedProductions];
      updatedProductions[index] = {
        ...updatedProductions[index],
        productId,
        templateId: recipe.templateId,
        materials: materialsWithBatches,
        recipe: recipe
      };
      setSelectedProductions(updatedProductions);
    } catch (error) {
      setError('Failed to load recipe details');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (index, quantity) => {
    const updatedProductions = [...selectedProductions];
    updatedProductions[index] = {
      ...updatedProductions[index],
      quantity: parseInt(quantity) || 1,
      materials: updatedProductions[index].materials.map(material => ({
        ...material,
        amountNeeded: (material.amountNeeded / updatedProductions[index].quantity) * quantity
      }))
    };
    setSelectedProductions(updatedProductions);
  };

  const handleBatchSelect = (productionIndex, materialIndex, batchId) => {
    const updatedProductions = [...selectedProductions];
    updatedProductions[productionIndex].materials[materialIndex].selectedBatchId = parseInt(batchId);
    setSelectedProductions(updatedProductions);
  };

  const addProduction = () => {
    setSelectedProductions([
      ...selectedProductions,
      { productId: '', templateId: '', quantity: 1, materials: [], recipe: null }
    ]);
  };

  const removeProduction = (index) => {
    setSelectedProductions(selectedProductions.filter((_, i) => i !== index));
  };

  const validateProduction = (production) => {
    // Temel doğrulamalar
    if (!production.productId || !production.quantity || production.quantity < 1) {
      console.log('Basic validation failed:', { 
        hasProductId: !!production.productId, 
        quantity: production.quantity 
      });
      return false;
    }
    
    // Malzeme doğrulaması
    if (!production.materials || production.materials.length === 0) {
      console.log('No materials found');
      return false;
    }

    // Her malzeme için parti ve miktar kontrolü
    const materialsValid = production.materials.every(material => {
      if (!material.selectedBatchId) {
        console.log('Missing batch for material:', material);
        return false;
      }

      const selectedBatch = material.batches.find(b => b.id === parseInt(material.selectedBatchId));
      if (!selectedBatch) {
        console.log('Batch not found:', material.selectedBatchId);
        return false;
      }

      if (selectedBatch.remainingAmount < material.amountNeeded) {
        console.log('Insufficient amount:', {
          remaining: selectedBatch.remainingAmount,
          needed: material.amountNeeded
        });
        return false;
      }

      return true;
    });

    console.log('Materials validation result:', materialsValid);
    return materialsValid;
  };


  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      const productionsToSubmit = selectedProductions
        .filter(validateProduction)
        .map(({ templateId, quantity, materials }) => ({
          productTemplateId: parseInt(templateId),
          quantity: parseInt(quantity),
          selectedMaterials: materials.map(m => ({
            batchId: parseInt(m.selectedBatchId),
            amountUsed: parseFloat(m.amountNeeded)
          }))
        }));

      if (productionsToSubmit.length === 0) {
        setError('Please select products and valid batches for all materials');
        return;
      }

      const response = await axios.post('http://localhost:5001/api/productions/bulk', {
        productions: productionsToSubmit
      });

      if (response.data.success) {
        onSuccess?.();
        onClose();
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to start productions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Start Bulk Production</h2>
        {error && (
          <div className="text-sm px-3 py-1 bg-red-100 text-red-600 rounded-md">
            {error}
          </div>
        )}
      </div>
  
      <div className="space-y-6">
        {selectedProductions.map((production, productionIndex) => (
          <div key={productionIndex} className="p-6 border rounded-xl bg-white shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">
                Production {productionIndex + 1}
              </h3>
              {productionIndex > 0 && (
                <button
                  onClick={() => removeProduction(productionIndex)}
                  className="text-sm px-3 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                >
                  Remove Production
                </button>
              )}
            </div>
  
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Product
                </label>
                <select
                  value={production.productId}
                  onChange={(e) => handleProductChange(productionIndex, e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Select Product</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
  
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={production.quantity}
                  onChange={(e) => handleQuantityChange(productionIndex, e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
  
            {production.materials.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-800">Required Materials</h4>
                <div className="space-y-4">
                  {production.materials.map((material, materialIndex) => (
                    <div key={materialIndex} className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-medium text-gray-800">
                          {material.materialName}
                        </span>
                        <span className="text-sm px-2 py-1 bg-blue-100 text-blue-800 rounded-md">
                          Required: {material.amountNeeded.toFixed(2)}g
                        </span>
                      </div>
                      <select
                        value={material.selectedBatchId}
                        onChange={(e) => handleBatchSelect(productionIndex, materialIndex, e.target.value)}
                        className="w-full p-2.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="">Select Batch</option>
                        {material.batches.map(batch => (
                          <option
                            key={batch.id}
                            value={batch.id}
                            disabled={batch.remainingAmount < material.amountNeeded}
                            className={batch.remainingAmount < material.amountNeeded ? 'text-gray-400' : ''}
                          >
                            Batch #{batch.serialNumber} - {batch.remainingAmount}g available
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
  
      <button
        onClick={addProduction}
        className="mt-6 flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add Another Production
      </button>
  
      <div className="mt-8 pt-4 border-t flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || selectedProductions.every(p => !validateProduction(p))}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Starting Productions...
            </>
          ) : (
            'Start Productions'
          )}
        </button>
      </div>
    </div>
  );
};

export default BulkProductionModal;