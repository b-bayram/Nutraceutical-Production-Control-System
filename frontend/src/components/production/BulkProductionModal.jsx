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
    updatedProductions[productionIndex].materials[materialIndex].selectedBatchId = batchId;
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
    if (!production.productId || !production.quantity || production.quantity < 1) return false;
    
    return production.materials.every(material => {
      if (!material.selectedBatchId) return false;
      const selectedBatch = material.batches.find(b => b.id === material.selectedBatchId);
      return selectedBatch && selectedBatch.remainingAmount >= material.amountNeeded;
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      const productionsToSubmit = selectedProductions
        .filter(validateProduction)
        .map(({ templateId, quantity, materials }) => ({
          productTemplateId: templateId,
          quantity,
          selectedMaterials: materials.map(m => ({
            batchId: m.selectedBatchId,
            amountUsed: m.amountNeeded
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
      <h2 className="text-xl font-bold mb-4">Start Bulk Production</h2>

      <div className="space-y-6">
        {selectedProductions.map((production, productionIndex) => (
          <div key={productionIndex} className="p-4 border rounded-lg bg-gray-50">
            <div className="flex justify-between mb-4">
              <h3 className="font-medium">Production {productionIndex + 1}</h3>
              {productionIndex > 0 && (
                <button
                  onClick={() => removeProduction(productionIndex)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product
                </label>
                <select
                  value={production.productId}
                  onChange={(e) => handleProductChange(productionIndex, e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Select Product</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={production.quantity}
                  onChange={(e) => handleQuantityChange(productionIndex, e.target.value)}
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>

            {production.materials.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Required Materials:</h4>
                <div className="space-y-3">
                  {production.materials.map((material, materialIndex) => (
                    <div key={materialIndex} className="p-3 bg-white rounded border">
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">{material.materialName}</span>
                        <span className="text-gray-600">
                          Required: {material.amountNeeded.toFixed(2)}g
                        </span>
                      </div>
                      <select
                        value={material.selectedBatchId}
                        onChange={(e) => handleBatchSelect(productionIndex, materialIndex, e.target.value)}
                        className="w-full p-2 border rounded-md bg-gray-50"
                      >
                        <option value="">Select Batch</option>
                        {material.batches.map(batch => (
                          <option 
                            key={batch.id} 
                            value={batch.id}
                            disabled={batch.remainingAmount < material.amountNeeded}
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
        className="mt-4 text-blue-600 hover:text-blue-800"
      >
        + Add Another Production
      </button>

      {error && (
        <div className="mt-4 p-2 bg-red-100 text-red-600 rounded">
          {error}
        </div>
      )}

      <div className="mt-6 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-600 border rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || selectedProductions.every(p => !validateProduction(p))}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Starting Productions...' : 'Start Productions'}
        </button>
      </div>
    </div>
  );
};

export default BulkProductionModal;