import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import './RawMaterials.css';
import LoadingSpinner from '../assets/LoadingSpinner';
import Layout from './Layout';
import Modal from './Modal';
import EditBatchForm from '../components/batch/EditBatchForm';
import AddTypeForm from '../components/batch/AddTypeForm';
import AddBatchForm from '../components/batch/AddBatchForm';
import GroupedMaterials from '../components/rawmaterials/GroupedMaterials';
function RawMaterials() {
  // State for materials and types
  const [materials, setMaterials] = useState([]);
  const [materialTypes, setMaterialTypes] = useState([]);
  
  // Modal states
  const [isAddTypeModalOpen, setAddTypeModalOpen] = useState(false);
  const [isAddBatchModalOpen, setAddBatchModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  
  // Selection mode states
  const [selectedBatches, setSelectedBatches] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMaterialTypes();
    fetchBatches();
  }, []);

  const fetchMaterialTypes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/raw-materials/types`);
      const data = await response.json();
      if (data.success) {
        setMaterialTypes(data.data);
      }
    } catch (error) {
      console.error('Error fetching material types:', error);
      setError('Failed to load material types. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBatches = async () => {
    setIsLoading(true);
    try {
      // Fetch both material types and batches
      const [typesResponse, batchesResponse] = await Promise.all([
        fetch(`${API_URL}/api/raw-materials/types`),
        fetch(`${API_URL}/api/raw-materials/batches`)
      ]);
  
      const typesData = await typesResponse.json();
      const batchesData = await batchesResponse.json();
  
      if (typesData.success && batchesData.success) {
        // Create a map of material types with empty batch arrays and include typeId
        const materialMap = typesData.data.reduce((acc, type) => {
          acc[type.name] = {
            typeId: type.id,  // Store the typeId
            batches: []
          };
          return acc;
        }, {});
  
        // Fill in the batches where they exist
        batchesData.data.forEach(batch => {
          if (materialMap.hasOwnProperty(batch.materialName)) {
            materialMap[batch.materialName].batches.push(batch);
          }
        });
  
        // Convert to array format expected by GroupedMaterials
        const combinedData = Object.entries(materialMap).map(([materialName, data]) => ({
          materialName,
          typeId: data.typeId,  // Include typeId in the final structure
          batches: data.batches
        }));
  
        // Sort by material name
        const sortedData = combinedData.sort((a, b) => 
          a.materialName.localeCompare(b.materialName)
        );
  
        setMaterials(sortedData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Please try again later.');
      setMaterials([]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedBatches([]);
    }
  };

  const handleEdit = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/raw-materials/batches/${id}`);
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
      const response = await fetch(`${API_URL}/api/raw-materials/batches/${selectedBatch.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });
      const data = await response.json();
      if (data.success) {
        fetchBatches();
        setEditModalOpen(false);
      }
    } catch (error) {
      console.error('Error updating batch:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedBatches.length) {
      alert('Please select items to delete');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedBatches.length} selected items?`)) {
      try {
        const payload = { ids: selectedBatches.map(id => parseInt(id)) };
        const response = await fetch(`${API_URL}/api/raw-materials/batches/bulk-delete`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (data.success) {
          setSelectedBatches([]);
          await fetchBatches();
        } else {
          alert('Failed to delete batches: ' + data.error);
        }
      } catch (error) {
        console.error('Error deleting batches:', error);
        alert('Error deleting batches');
      }
    }
  };

  const handleAddType = async (typeData) => {
    try {
      const response = await fetch(`${API_URL}/api/raw-materials/types`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(typeData),
      });
      const data = await response.json();
      if (data.success) {
        await fetchMaterialTypes();
        setAddTypeModalOpen(false);
      }
    } catch (error) {
      console.error('Error adding material type:', error);
    }
  };

  const handleDeleteType = async (typeId) => {
    try {
      const response = await fetch(`${API_URL}/api/raw-materials/types/bulk-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: [typeId] }),
      });
  
      const data = await response.json();
      
      if (data.success) {
        await fetchBatches(); // Refresh the list after successful deletion
      } else {
        // Check if the error is due to a reference constraint
        if (data.error && data.error.includes('REFERENCE constraint')) {
          alert('This material type cannot be deleted because it is being used in recipes.');
        } else {
          alert(data.error || 'Failed to delete material type');
        }
      }
    } catch (error) {
      if (error.message && error.message.includes('REFERENCE constraint')) {
        alert('This material type cannot be deleted because it is being used in recipes.');
      } else {
        console.error('Error deleting material type:', error);
        alert('Error deleting material type');
      }
    }
  };
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/raw-materials/batches/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        fetchBatches();
        setEditModalOpen(false);
      } else {
        alert(data.message || 'Failed to delete batch');
      }
    } catch (error) {
      console.error('Error deleting batch:', error);
      alert('Error deleting batch');
    }
  };

  const handleAddBatch = async (batchData) => {
    try {
      const response = await fetch(`${API_URL}/api/raw-materials/batches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batchData),
      });
      const data = await response.json();
      if (data.success) {
        fetchBatches();
        setAddBatchModalOpen(false);
      } else {
        console.error('Failed to add batch:', data.error);
      }
    } catch (error) {
      console.error('Error adding batch:', error);
    }
  };

  return (
    <Layout>
      <div className="raw-materials-page">
        <div className="header">
          <h1>Raw Materials</h1>
          <div className="header-buttons">
            {!isSelectionMode ? (
              <>
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
              </>
            ) : (
              <div className="selection-mode-controls">
                <span>{selectedBatches.length} items selected</span>
                <button 
                  className="cancel-btn"
                  onClick={toggleSelectionMode}
                >
                  Cancel
                </button>
                <button 
                  className="delete-btn"
                  onClick={handleBulkDelete}
                  disabled={selectedBatches.length === 0}
                >
                  Delete Selected
                </button>
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-lg text-red-600 my-4">
            {error}
          </div>
        ) : (
          <GroupedMaterials 
            materials={materials}
            onEdit={handleEdit}
            onAddBatch={() => setAddBatchModalOpen(true)}
            onDeleteType={handleDeleteType}
          />
        )}

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

        <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)}>
          <EditBatchForm 
            batch={selectedBatch}
            onSubmit={handleUpdateBatch}
            onDelete={handleDelete}
            onClose={() => setEditModalOpen(false)}
          />
        </Modal>
      </div>
    </Layout>
  );
}

export default RawMaterials;