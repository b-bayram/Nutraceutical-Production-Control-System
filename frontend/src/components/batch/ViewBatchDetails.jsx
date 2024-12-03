import React, { useState } from 'react';
import { Label } from "../ui/label"

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
    <form onSubmit={handleSubmit} className="p-6">
      <h2 className="text-2xl font-bold mb-6">Edit Batch</h2>

      <div className="space-y-4">
        {/* Read-only fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-gray-500">Material Type</span>
            <p className="font-medium">{batch.materialName}</p>
          </div>
          
          <div>
            <span className="text-sm text-gray-500">Supplier</span>
            <p className="font-medium">{batch.supplierName}</p>
          </div>
        </div>

        {/* Editable fields */}
        <div className="space-y-4">
          <div>
            <label htmlFor="serialNumber" className="block text-sm text-gray-500">Batch ID</label>
            <input
              id="serialNumber"
              name="serialNumber"
              value={formData.serialNumber}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label htmlFor="remainingAmount" className="block text-sm text-gray-500">Remaining Amount</label>
            <input
              id="remainingAmount"
              name="remainingAmount"
              type="number"
              step="0.01"
              value={formData.remainingAmount}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label htmlFor="expirationDate" className="block text-sm text-gray-500">Expiration Date</label>
            <input
              id="expirationDate"
              name="expirationDate"
              type="date"
              value={formData.expirationDate}
              onChange={handleChange}
              className="w-full p-2 border rounded"
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