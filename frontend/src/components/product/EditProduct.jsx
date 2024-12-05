import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Label } from '../ui/label';
import { Input } from '../ui/input';

const EditProduct = ({ product, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [recipeData, setRecipeData] = useState({
    version: '1.0',
    materials: []
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || ''
      });
      // Fetch existing recipe if any
      fetchRecipe();
    }
  }, [product]);

  const fetchRecipe = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/api/products/${product.id}/recipe`);
      if (response.data.success) {
        setRecipeData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching recipe:', error);
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
    try {
      const response = await axios.put(`http://localhost:5001/api/products/${product.id}`, formData);
      if (response.data.success) {
        onClose();
      }
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const handleRecipeSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`http://localhost:5001/api/products/${product.id}/recipe`, recipeData);
      if (response.data.success) {
        setShowRecipeForm(false);
        fetchRecipe();
      }
    } catch (error) {
      console.error('Error updating recipe:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Edit Product</h2>
      </div>

      <form onSubmit={handleSubmit} className="mb-6">
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
              className="w-full mt-1 p-2 border rounded-md min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-2">
          <button
            type="button"
            onClick={() => setShowRecipeForm(true)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Manage Recipe
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save Changes
          </button>
        </div>
      </form>

      {showRecipeForm && (
        <div className="mt-6 pt-6 border-t">
          <h3 className="text-lg font-semibold mb-4">Recipe Management</h3>
          <form onSubmit={handleRecipeSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="version">Version</Label>
                <Input
                  id="version"
                  value={recipeData.version}
                  onChange={(e) => setRecipeData({ ...recipeData, version: e.target.value })}
                  className="w-full mt-1"
                  required
                />
              </div>
              
              {/* We'll add material management here in the next iteration */}
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowRecipeForm(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Save Recipe
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

//TODO HANDLE RECIPE

export default EditProduct;