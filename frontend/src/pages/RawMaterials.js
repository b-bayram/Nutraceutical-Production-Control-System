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
  const [selectedBatches, setSelectedBatches] = useState([]);
  //bulk delete checkboxes
  const [isSelectionMode, setIsSelectionMode] = useState(false);

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
        const response = await fetch('http://localhost:5001/api/raw-materials/batches');
        const data = await response.json();
        if (data.success) {
            setMaterials(data.data || []); // Make sure to set an empty array if no data
            setSelectedBatches([]); // Reset selections whenever we fetch new data
        }
    } catch (error) {
        console.error('Error fetching batches:', error);
        setMaterials([]); // Reset to empty array on error
        setSelectedBatches([]); // Reset selections on error
    }
};

const toggleSelectionMode = () => {
  setIsSelectionMode(!isSelectionMode);
  if (isSelectionMode) {
    setSelectedBatches([]);
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

  const handleBulkDelete = async () => {
    if (!selectedBatches.length) {
        alert('Please select items to delete');
        return;
    }

    console.log('Selected batches:', selectedBatches); // See what we're starting with

    if (window.confirm(`Are you sure you want to delete ${selectedBatches.length} selected items?`)) {
        try {
            const payload = { ids: selectedBatches.map(id => parseInt(id)) }; // Convert to integers
            console.log('Sending payload:', payload);

            const response = await fetch('http://localhost:5001/api/raw-materials/batches/bulk-delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);

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
            {!isSelectionMode ? (
              <>
                <button 
                  className="select-mode-btn"
                  onClick={toggleSelectionMode}
                >
                  Select Items
                </button>
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

        {/* Existing stats section */}
        <div className="stats-container">
          {/* ... stats cards ... */}
        </div>

        {/* New table section */}
        <div className="materials-table">
            
            <table className="w-full">
                <thead>
                    <tr>
                    {isSelectionMode && (
                          <th className="px-4 py-2">
                            <input
                              type="checkbox"
                              checked={selectedBatches.length === materials.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedBatches(materials.map(m => m.id));
                                } else {
                                  setSelectedBatches([]);
                                }
                              }}
                            />
                          </th>
                        )}
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
                            {isSelectionMode && (
                            <td className="px-4 py-2">
                              <input
                                type="checkbox"
                                checked={selectedBatches.includes(material.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedBatches([...selectedBatches, material.id]);
                                  } else {
                                    setSelectedBatches(selectedBatches.filter(id => id !== material.id));
                                  }
                                }}
                              />
                            </td>
                            )}
                            <td>{material.serialNumber}</td>
                            <td>{material.materialName}</td>
                            <td>{material.remainingAmount}</td>
                            <td>{material.supplierName}</td>
                            <td>{new Date(material.expirationDate).toLocaleDateString()}</td>
                            <td>
                            {!isSelectionMode && (
                              <>
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
                              </>
                            )}
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