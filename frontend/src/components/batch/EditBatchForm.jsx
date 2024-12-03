import React, { useState } from 'react';

import { Label } from "../ui/label"
import { Input } from "../ui/input"

const EditBatchForm = ({ batch, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    serialNumber: batch?.serialNumber || '',
    remainingAmount: batch?.remainingAmount || '',
    expirationDate: batch?.expirationDate 
      ? new Date(batch.expirationDate).toISOString().split('T')[0] 
      : ''
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

  if (!batch) return null;

  return (
    <form onSubmit={handleSubmit} className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Edit Batch</h2>

      <div className="space-y-4">
        {/* Read-only fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm text-gray-500">Material Type</Label>
            <p className="font-medium">{batch.materialName}</p>
          </div>
          
          <div>
            <Label className="text-sm text-gray-500">Supplier</Label>
            <p className="font-medium">{batch.supplierName}</p>
          </div>
        </div>

        {/* Editable fields */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="serialNumber">Batch ID</Label>
            <Input
              id="serialNumber"
              name="serialNumber"
              value={formData.serialNumber}
              onChange={handleChange}
              className="w-full"
            />
          </div>

          <div>
            <Label htmlFor="remainingAmount">Remaining Amount</Label>
            <Input
              id="remainingAmount"
              name="remainingAmount"
              type="number"
              step="0.01"
              value={formData.remainingAmount}
              onChange={handleChange}
              className="w-full"
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
            />
          </div>
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
          Save Changes
        </button>
      </div>
    </form>
  );
};

export default EditBatchForm;