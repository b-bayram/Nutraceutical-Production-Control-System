import React, { useState } from 'react';
import { Label } from "../ui/label";
import { Input } from "../ui/input";

const AddBatchForm = ({ materialTypes, onSubmit, onClose }) => {
const [formData, setFormData] = useState({
    typeId: '',
    serialNumber: '',
    remainingAmount: '',
    supplierId: '1',
    purchaseDate: new Date().toISOString().split('T')[0], // Add today's date as default
    expirationDate: ''
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
      <h2 className="text-2xl font-bold mb-6">Add New Batch</h2>

      <div className="space-y-4">
        <div>
          <Label htmlFor="typeId">Material Type</Label>
          <select
            id="typeId"
            name="typeId"
            value={formData.typeId}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Select Material Type</option>
            {materialTypes.map(type => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="serialNumber">Batch ID</Label>
          <Input
            id="serialNumber"
            name="serialNumber"
            value={formData.serialNumber}
            onChange={handleChange}
            className="w-full"
            required
          />
        </div>

        <div>
          <Label htmlFor="remainingAmount">Amount</Label>
          <Input
            id="remainingAmount"
            name="remainingAmount"
            type="number"
            step="0.01"
            value={formData.remainingAmount}
            onChange={handleChange}
            className="w-full"
            required
          />
        </div>

        <div>
        <Label htmlFor="purchaseDate">Purchase Date</Label>
        <Input
            id="purchaseDate"
            name="purchaseDate"
            type="date"
            value={formData.purchaseDate}
            onChange={handleChange}
            className="w-full"
            required
        />
        </div>    
        <div>
          <Label htmlFor="expirationDate">Expiration Date</Label>
          <Input
            id="expirationDate"
            name="expirationDate"
            type="date"
            value={formData.expirationDate}
            onChange={handleChange}
            className="w-full"
            required
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
          Add Batch
        </button>
      </div>
    </form>
  );
};

export default AddBatchForm;