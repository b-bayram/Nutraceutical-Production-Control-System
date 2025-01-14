import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../config';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

const RecipeManager = ({ productId, onClose }) => {
    const [recipes, setRecipes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isAddingRecipe, setIsAddingRecipe] = useState(false);
    const [materialTypes, setMaterialTypes] = useState([]);
    const [newRecipe, setNewRecipe] = useState({
        materials: [{ materialTypeId: '', amount: '' }]
    });

    useEffect(() => {
        fetchRecipes();
        fetchMaterialTypes();
    }, [productId]);

    const fetchRecipes = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get(`${API_URL}/api/products/${productId}/recipes`);
            if (response.data.success) {
                setRecipes(response.data.data);
            }
        } catch (error) {
            setError('Failed to load recipes');
            console.error('Error fetching recipes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMaterialTypes = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/raw-materials/types`);
            if (response.data.success) {
                setMaterialTypes(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching material types:', error);
        }
    };

    const handleAddMaterial = () => {
        setNewRecipe(prev => ({
            ...prev,
            materials: [...prev.materials, { materialTypeId: '', amount: '' }]
        }));
    };

    const handleRemoveMaterial = (index) => {
        setNewRecipe(prev => ({
            ...prev,
            materials: prev.materials.filter((_, i) => i !== index)
        }));
    };

    const handleMaterialChange = (index, field, value) => {
        setNewRecipe(prev => ({
            ...prev,
            materials: prev.materials.map((material, i) => 
                i === index ? { ...material, [field]: value } : material
            )
        }));
    };

    const handleSubmitRecipe = async () => {
        try {
            // Validate materials
            const invalidMaterials = newRecipe.materials.filter(
                m => !m.materialTypeId || !m.amount || isNaN(m.amount) || parseFloat(m.amount) <= 0
            );

            if (invalidMaterials.length > 0) {
                setError('Please fill in all material fields with valid amounts');
                return;
            }

            setIsLoading(true);
            setError(null);

            console.log('Submitting recipe:', {
                productId,
                materials: newRecipe.materials
            });

            const response = await axios.post(`${API_URL}/api/products/${productId}/recipe`, {
                materials: newRecipe.materials.map(m => ({
                    materialTypeId: parseInt(m.materialTypeId),
                    amount: parseFloat(m.amount)
                }))
            });

            console.log('Recipe submission response:', response.data);

            if (response.data.success) {
                await fetchRecipes();
                setIsAddingRecipe(false);
                setNewRecipe({ materials: [{ materialTypeId: '', amount: '' }] });
            } else {
                setError(response.data.error || 'Failed to add recipe');
            }
        } catch (error) {
            console.error('Error adding recipe:', error);
            setError(error.response?.data?.error || 'Failed to add recipe. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleActivateRecipe = async (templateId) => {
        try {
            setIsLoading(true);
            const response = await axios.put(`${API_URL}/api/products/${productId}/recipe/${templateId}/activate`);
            if (response.data.success) {
                await fetchRecipes();
            }
        } catch (error) {
            setError('Failed to activate recipe');
            console.error('Error activating recipe:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div className="p-6 max-w-4xl w-full">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Recipe Management</h2>
                <Button onClick={() => setIsAddingRecipe(!isAddingRecipe)}>
                    {isAddingRecipe ? 'Cancel' : 'Add New Recipe'}
                </Button>
            </div>

            {isAddingRecipe && (
                <div className="mb-8 p-4 border rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">New Recipe</h3>
                    {newRecipe.materials.map((material, index) => (
                        <div key={index} className="flex gap-4 mb-4">
                            <select
                                className="flex-1 p-2 border rounded"
                                value={material.materialTypeId}
                                onChange={(e) => handleMaterialChange(index, 'materialTypeId', e.target.value)}
                            >
                                <option value="">Select Material</option>
                                {materialTypes.map(type => (
                                    <option key={type.id} value={type.id}>
                                        {type.name}
                                    </option>
                                ))}
                            </select>
                            <Input
                                type="number"
                                placeholder="Amount (g)"
                                value={material.amount}
                                onChange={(e) => handleMaterialChange(index, 'amount', e.target.value)}
                                className="w-32"
                            />
                            <Button
                                variant="outline"
                                onClick={() => handleRemoveMaterial(index)}
                            >
                                Remove
                            </Button>
                        </div>
                    ))}
                    <div className="flex gap-4 mt-4">
                        <Button onClick={handleAddMaterial}>
                            Add Material
                        </Button>
                        <Button onClick={handleSubmitRecipe}>
                            Save Recipe
                        </Button>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {recipes.map(recipe => (
                    <div key={recipe.templateId} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <span className="font-semibold">Version {recipe.version}</span>
                                <span className={`ml-2 px-2 py-1 rounded-full text-sm ${
                                    recipe.isActive 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-gray-100 text-gray-800'
                                }`}>
                                    {recipe.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            {!recipe.isActive && (
                                <Button
                                    onClick={() => handleActivateRecipe(recipe.templateId)}
                                >
                                    Set Active
                                </Button>
                            )}
                        </div>
                        <div className="space-y-2">
                            {recipe.materials.map((material, index) => (
                                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                    <span>{material.materialName}</span>
                                    <span>{material.amount}g</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-end mt-6">
                <Button variant="outline" onClick={onClose}>
                    Close
                </Button>
            </div>
        </div>
    );
};

export default RecipeManager; 