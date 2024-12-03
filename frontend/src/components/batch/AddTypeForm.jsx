import React, { useState } from 'react';
import { Label } from "../ui/label";
import { Input } from "../ui/input";

const AddTypeForm = ({ onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <h2 className="text-2xl font-bold mb-6">Add Material Type</h2>

      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full"
          />
        </div>
      </div>

      <div className="mt-8 flex justify-end space-x-4">
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
          Add Type
        </button>
      </div>
    </form>
  );
};

export default AddTypeForm;