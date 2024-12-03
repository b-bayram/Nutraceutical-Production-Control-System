import React, { useState, useEffect } from 'react';
import './RawMaterials.css';
import Layout from './Layout';
import Modal from './Modal';
import ViewBatchDetails from '../components/batch/ViewBatchDetails';
import EditBatchForm from '../components/batch/EditBatchForm';
import AddTypeForm from '../components/batch/AddTypeForm';
import AddBatchForm from '../components/batch/AddBatchForm';


function RawMaterials() {
  // Existing state
  const [materials, setMaterials] = useState([]);
  const [materialTypes, setMaterialTypes] = useState([]);
  const [isAddTypeModalOpen, setAddTypeModalOpen] = useState(false);
  const [isAddBatchModalOpen, setAddBatchModalOpen] = useState(false);
  // New state for view/edit
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [isViewModalOpen, setViewModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);

  useEffect(() => {
    fetchMaterialTypes();
    fetchBatches();
  }, []);

  const fetchMaterialTypes = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/raw-materials/types');
      const data = await response.json();
      if (data.success) {
        setMaterialTypes(data.data);
      }
    } catch (error) {
      console.error('Error fetching material types:', error);
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/raw-materials/batches');  // Changed from /types to /batches
      const data = await response.json();
      if (data.success) {
        setMaterials(data.data);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  // New handlers for view/edit
  const handleView = async (id) => {
    try {
      const response = await fetch(`http://localhost:5001/api/raw-materials/batches/${id}`);
      const data = await response.json();
      if (data.success) {
        setSelectedBatch(data.data);
        setViewModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching batch details:', error);
    }
  };

  const handleEdit = async (id) => {
    try {
      const response = await fetch(`http://localhost:5001/api/raw-materials/batches/${id}`);
      const data = await response.json();
      if (data.success) {
        setSelectedBatch(data.data);
        setEditModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching batch for edit:', error);
    }
  };

  const handleUpdateBatch = async (updatedData) => {
    try {
      const response = await fetch(`http://localhost:5001/api/raw-materials/batches/${selectedBatch.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });
      const data = await response.json();
      if (data.success) {
        fetchBatches(); // Refresh the list
        setEditModalOpen(false);
      }
    } catch (error) {
      console.error('Error updating batch:', error);
    }
  };

  const handleAddType = async (typeData) => {
    try {
      const response = await fetch('http://localhost:5001/api/raw-materials/types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(typeData),
      });
      const data = await response.json();
      if (data.success) {
        await fetchMaterialTypes(); // Refresh the list
        setAddTypeModalOpen(false);
      }
    } catch (error) {
      console.error('Error adding material type:', error);
    }
  };
  
  const handleAddBatch = async (batchData) => {
  try {
    console.log('Sending batch data:', batchData); // Add this line
    const response = await fetch('http://localhost:5001/api/raw-materials/batches', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batchData),
    });
    const data = await response.json();
    console.log('Response:', data); // Add this line
    if (data.success) {
      fetchBatches(); // Refresh the list
      setAddBatchModalOpen(false);
    } else {
      console.error('Failed to add batch:', data.error); // Add this line
    }
  } catch (error) {
    console.error('Error adding batch:', error);
  }
};


  return (
    <Layout>
      <div className="raw-materials-page">
        {/* Existing header section */}
        <div className="header">
          <h1>Raw Materials</h1>
          <div className="header-buttons">
            <button 
              className="add-btn"
              onClick={() => setAddBatchModalOpen(true)}
            >
              Add New Batch
            </button>
            <button 
              className="add-type-btn"
              onClick={() => setAddTypeModalOpen(true)}
            >
              Add Material Type
            </button>
          </div>
        </div>

        {/* Existing stats section */}
        <div className="stats-container">
          {/* ... stats cards ... */}
        </div>

        {/* New table section */}
        <div className="materials-table">
          <table className="w-full">
            <thead>
              <tr>
                <th>Batch ID</th>
                <th>Material Type</th>
                <th>Remaining Amount</th>
                <th>Supplier</th>
                <th>Expiration Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((material) => (
                <tr key={material.id}>
                  <td>{material.serialNumber}</td>
                  <td>{material.materialName}</td>
                  <td>{material.remainingAmount}</td>
                  <td>{material.supplierName}</td>
                  <td>{new Date(material.expirationDate).toLocaleDateString()}</td>
                  <td>
                    <button 
                      onClick={() => handleEdit(material.id)} 
                      className="edit-btn"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleView(material.id)}
                      className="view-btn"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Existing modals */}
        <Modal isOpen={isAddTypeModalOpen} onClose={() => setAddTypeModalOpen(false)}>
          <AddTypeForm onSubmit={handleAddType} onClose={() => setAddTypeModalOpen(false)} />
        </Modal>

        <Modal isOpen={isAddBatchModalOpen} onClose={() => setAddBatchModalOpen(false)}>
          <AddBatchForm 
            materialTypes={materialTypes}
            onSubmit={handleAddBatch} 
            onClose={() => setAddBatchModalOpen(false)}
          />
        </Modal>

        {/* New modals for view/edit */}
        <Modal isOpen={isViewModalOpen} onClose={() => setViewModalOpen(false)}>
          <ViewBatchDetails 
            batch={selectedBatch} 
            onClose={() => setViewModalOpen(false)} 
          />
        </Modal>

        <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)}>
          <EditBatchForm 
            batch={selectedBatch}
            onSubmit={handleUpdateBatch}
            onClose={() => setEditModalOpen(false)}
          />
        </Modal>
      </div>
    </Layout>
  );
}

export default RawMaterials;