import React, { useState, useEffect } from 'react';
import './RawMaterials.css';
import LoadingSpinner from '../assets/LoadingSpinner';
import Layout from './Layout';
import Modal from './Modal';
import EditBatchForm from '../components/batch/EditBatchForm';
import AddTypeForm from '../components/batch/AddTypeForm';
import AddBatchForm from '../components/batch/AddBatchForm';


function RawMaterials() {
  // Existing state
  const [materials, setMaterials] = useState([]);
  const [materialTypes, setMaterialTypes] = useState([]);
  const [isAddTypeModalOpen, setAddTypeModalOpen] = useState(false);
  const [isAddBatchModalOpen, setAddBatchModalOpen] = useState(false);
  // Modified state - removed view-related state
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedBatches, setSelectedBatches] = useState([]);
  //bulk delete checkboxes
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  // Added loading states to existing state declarations
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  //pagination variables
  const [currentPage, setCurrentPage] = useState(1);
  const materialsPerPage = 10;
  const indexOfLastMaterial = currentPage * materialsPerPage;
  const indexOfFirstMaterial = indexOfLastMaterial - materialsPerPage;
  const currentMaterials = materials.slice(indexOfFirstMaterial, indexOfLastMaterial);
  const totalPages = Math.ceil(materials.length / materialsPerPage);

  useEffect(() => {
    fetchMaterialTypes();
    fetchBatches();
  }, []);

  const fetchMaterialTypes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/raw-materials/types');
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
      const response = await fetch('http://localhost:5001/api/raw-materials/batches');
      const data = await response.json();
      if (data.success) {
        setMaterials(data.data || []);
        setSelectedBatches([]);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
      setError('Failed to load batches. Please try again later.');
      setMaterials([]);
      setSelectedBatches([]);
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

    if (window.confirm(`Are you sure you want to delete ${selectedBatches.length} selected items?`)) {
        try {
            const payload = { ids: selectedBatches.map(id => parseInt(id)) }; // Convert to integers
            const response = await fetch('http://localhost:5001/api/raw-materials/batches/bulk-delete', {
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
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:5001/api/raw-materials/batches/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        fetchBatches(); // Refresh the list
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
      const response = await fetch('http://localhost:5001/api/raw-materials/batches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batchData),
      });
      const data = await response.json();
      if (data.success) {
        fetchBatches(); // Refresh the list
        setAddBatchModalOpen(false);
      } else {
        console.error('Failed to add batch:', data.error);
      }
    } catch (error) {
      console.error('Error adding batch:', error);
    }
  };
  const getPageNumbers = () => {
    let pages = [];
    if (totalPages <= 5) {
      // If 5 or fewer pages, show all
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show current page, 2 before and 2 after when possible
      if (currentPage <= 3) {
        pages = [1, 2, 3, 4, '...', totalPages];
      } else if (currentPage >= totalPages - 2) {
        pages = [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
      } else {
        pages = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
      }
    }
    return pages;
  };
  
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
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

        <div className="stats-container">
          {/* ... stats cards ... */}
        </div>
            
        {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-lg text-red-600 my-4">
          {error}
        </div>
      ) : (
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
              {currentMaterials.map((material) => (
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
                      <button 
                        onClick={() => handleEdit(material.id)} 
                        className="edit-btn"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="pagination">
        <span className="showing-text">
          Showing {materials.length === 0 ? 0 : indexOfFirstMaterial + 1}-
          {Math.min(indexOfLastMaterial, materials.length)} of {materials.length} raw materials
        </span>
        <div className="page-buttons">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="page-btn"
          >
            Previous
          </button>
          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-2">...</span>
              ) : (
                <button
                  onClick={() => handlePageChange(page)}
                  className={`page-btn ${currentPage === page ? 'active' : ''}`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="page-btn"
          >
            Next
          </button>
        </div>
      </div>

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