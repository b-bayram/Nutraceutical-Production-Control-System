import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Tabs, TabPanel } from '../ui/tabs';

const EditProduct = ({ product, materialTypes, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [activeTab, setActiveTab] = useState('details');
  const [recipeData, setRecipeData] = useState({
    version: '1.0',
    materials: []
  });
  const [recipeHistory, setRecipeHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || ''
      });
      fetchRecipe();
      fetchRecipeHistory();
    }
  }, [product]);

  const fetchRecipe = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/api/products/${product.id}/recipe`);
      if (response.data.success) {
        const recipe = response.data.data;
        setRecipeData({
          version: recipe.version,
          materials: recipe.materials.map(m => ({
            materialTypeId: m.materialType.id,
            amountInGrams: m.amount
          }))
        });
      }
    } catch (error) {
      console.error('Error fetching recipe:', error);
    }
  };

  const fetchRecipeHistory = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/api/products/${product.id}/recipe/history`);
      if (response.data.success) {
        setRecipeHistory(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching recipe history:', error);
    }
  };

  const handleDeleteRecipe = async () => {
    if (!window.confirm('Are you sure you want to delete this recipe? This cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await axios.delete(`http://localhost:5001/api/products/${product.id}/recipe`);
      
      // Reset recipe data
      setRecipeData({
        version: '1.0',
        materials: []
      });
      
      // Refresh recipe history
      await fetchRecipeHistory();
      
    } catch (error) {
      setError('Failed to delete recipe. ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSetActiveRecipe = async (templateId) => {
    try {
      setLoading(true);
      const recipeResponse = await axios.get(`http://localhost:5001/api/products/${product.id}/recipe/history`);
      const targetRecipe = recipeResponse.data.data.find(r => r.templateId === templateId);
      
      if (targetRecipe) {
        await axios.put(
          `http://localhost:5001/api/products/${product.id}/recipe`,
          {
            version: targetRecipe.version,
            materials: targetRecipe.materials.map(m => ({
              materialTypeId: m.materialTypeId || m.materialType.id,
              amountInGrams: m.amountInGrams || m.amount
            }))
          }
        );
        
        fetchRecipeHistory();
      }
    } catch (error) {
      setError('Error setting active recipe');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const productResponse = await axios.put(
        `http://localhost:5001/api/products/${product.id}`, 
        formData
      );
      
      if (recipeData.materials.length > 0) {
        await axios.put(
          `http://localhost:5001/api/products/${product.id}/recipe`,
          {
            ...recipeData,
            isActive: true
          }
        );
      }

      if (productResponse.data.success) {
        onClose();
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Error updating product');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.delete(`http://localhost:5001/api/products/${product.id}`);
      if (response.data.success) {
        onClose();
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error deleting product');
    } finally {
      setLoading(false);
    }
  };

  const addMaterial = () => {
    setRecipeData({
      ...recipeData,
      materials: [...recipeData.materials, { materialTypeId: '', amountInGrams: '' }]
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Edit Product</h2>
        <Button
          type="button"
          variant="destructive"
          onClick={handleDelete}
          disabled={loading}
        >
          Delete Product
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Tabs defaultTab="details" onTabChange={setActiveTab}>
          <TabPanel id="details" title="Product Details">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full mt-1 p-2 border rounded-md min-h-[100px]"
                  required
                />
              </div>
            </div>
          </TabPanel>

          <TabPanel id="recipe" title="Recipe">
            <div className="space-y-6">
              {/* Recipe History Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <Label>Recipe History</Label>
                  {recipeHistory.length > 0 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteRecipe}
                      disabled={loading}
                    >
                      Delete Recipe
                    </Button>
                  )}
                </div>
                <div className="mt-2 border rounded-md divide-y">
                  {recipeHistory.length > 0 ? (
                    recipeHistory.map((recipe) => (
                      <div 
                        key={recipe.templateId} 
                        className="p-3 flex justify-between items-center hover:bg-gray-50"
                      >
                        <div>
                          <span className="font-medium">Version {recipe.version}</span>
                          <span className="text-sm text-gray-500 ml-2">
                            {new Date(recipe.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex gap-2 items-center">
                          {recipe.isActive ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                              Active
                            </span>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleSetActiveRecipe(recipe.templateId)}
                              disabled={loading}
                            >
                              Set Active
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-gray-500 text-center">
                      No recipe history available
                    </div>
                  )}
                </div>
              </div>

              {/* New Recipe Section */}
              <div className="pt-6 border-t">
                <div className="flex justify-between items-center mb-4">
                  <Label>New Recipe Version</Label>
                </div>

                <div className="space-y-4">
                  <Input
                    value={recipeData.version}
                    onChange={(e) => setRecipeData({ ...recipeData, version: e.target.value })}
                    placeholder="e.g., 1.0"
                  />

                  <div className="space-y-3">
                    <Label>Materials</Label>
                    {recipeData.materials.map((material, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <select
                          className="flex-1 p-2 border rounded-md"
                          value={material.materialTypeId}
                          onChange={(e) => {
                            const newMaterials = [...recipeData.materials];
                            newMaterials[index].materialTypeId = e.target.value;
                            setRecipeData({ ...recipeData, materials: newMaterials });
                          }}
                        >
                          <option value="">Select Material</option>
                          {materialTypes.map((type) => (
                            <option key={type.id} value={type.id}>
                              {type.name}
                            </option>
                          ))}
                        </select>

                        <Input
                          type="number"
                          placeholder="Amount (g)"
                          className="w-32"
                          value={material.amountInGrams}
                          onChange={(e) => {
                            const newMaterials = [...recipeData.materials];
                            newMaterials[index].amountInGrams = e.target.value;
                            setRecipeData({ ...recipeData, materials: newMaterials });
                          }}
                        />

                        <Button
                          type="button"
                          onClick={() => {
                            const newMaterials = recipeData.materials.filter((_, i) => i !== index);
                            setRecipeData({ ...recipeData, materials: newMaterials });
                          }}
                          variant="destructive"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}

                    <Button 
                      type="button" 
                      onClick={addMaterial}
                      variant="secondary"
                      className="w-full"
                      disabled={loading}
                    >
                      Add Material
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabPanel>
        </Tabs>

        <div className="mt-8 flex justify-end space-x-3">
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditProduct;