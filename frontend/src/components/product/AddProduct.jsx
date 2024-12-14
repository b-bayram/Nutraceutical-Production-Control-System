import React, { useState } from 'react';
import axios from 'axios';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabPanel } from '../ui/tabs';

const AddProduct = ({ onClose, materialTypes, onAdd }) => {
 const [formData, setFormData] = useState({
   name: '',
   description: '',
   sku: '',
   category: ''
 });

 const [recipeData, setRecipeData] = useState({
   version: '1.0',
   materials: []
 });

 const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    // First create the product
    const response = await axios.post('http://localhost:5001/api/products', formData);
    if (response.data.success) {
      // If we have recipe data, add it as an active recipe
      if (recipeData.materials.length > 0) {
        await axios.post(
          `http://localhost:5001/api/products/${response.data.data.id}/recipe`, 
          {
            ...recipeData,
            isActive: true  // Add this line to make recipe active
          }
        );
      }
      if (onAdd) onAdd(response.data.data);
      onClose();
    }
  } catch (error) {
    console.error('Error adding product:', error);
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
     <h2 className="text-2xl font-bold mb-6">Add New Product</h2>
     
     <form onSubmit={handleSubmit}>
       <Tabs defaultTab="details">
         <TabPanel id="details" title="Product Details">
           <div className="space-y-4">
             <div>
               <Label>Product Name</Label>
               <Input
                 value={formData.name}
                 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                 required
               />
             </div>

             <div>
               <Label>SKU</Label>
               <Input
                 value={formData.sku}
                 onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
               />
             </div>

             <div>
               <Label>Category</Label>
               <select
                 className="w-full p-2 border rounded-md"
                 value={formData.category}
                 onChange={(e) => setFormData({ ...formData, category: e.target.value })}
               >
                 <option value="">Select Category</option>
                 <option value="tablets">Tablets</option>
                 <option value="capsules">Capsules</option>
                 <option value="powders">Powders</option>
               </select>
             </div>

             <div>
               <Label>Description</Label>
               <textarea
                 className="w-full p-2 border rounded-md min-h-[100px]"
                 value={formData.description}
                 onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                 required
               />
             </div>
           </div>
         </TabPanel>

         <TabPanel id="recipe" title="Recipe">
           <div className="space-y-4">
             <div>
               <Label>Recipe Version</Label>
               <Input
                 value={recipeData.version}
                 onChange={(e) => setRecipeData({ ...recipeData, version: e.target.value })}
               />
             </div>

             <div className="space-y-4">
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
               >
                 Add Material
               </Button>
             </div>
           </div>
         </TabPanel>
       </Tabs>

       <div className="flex justify-end gap-4 mt-6 pt-6 border-t">
         <Button type="button" variant="outline" onClick={onClose}>
           Cancel
         </Button>
         <Button type="submit">
           Create Product
         </Button>
       </div>
     </form>
   </div>
 );
};

export default AddProduct;