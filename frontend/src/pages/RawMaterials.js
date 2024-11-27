import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import Modal from './Modal';
import axios from 'axios';
import './RawMaterials.css';

function RawMaterials() {
  const [materials, setMaterials] = useState([]);
  const [materialTypes, setMaterialTypes] = useState([]);
  const [isAddTypeModalOpen, setAddTypeModalOpen] = useState(false);
  const [isAddBatchModalOpen, setAddBatchModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState({
    totalBatches: 0,
    inStock: 0,
    lowStock: 0,
    expired: 0
  });

  useEffect(() => {
    fetchMaterialTypes();
    fetchBatches();
  }, []);

  const fetchMaterialTypes = async () => {
    try {
      const response = await axios.get('/api/raw-materials/types');
      setMaterialTypes(response.data);
    } catch (error) {
      console.error('Error fetching material types:', error);
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await axios.get('/api/raw-materials/batches');
      setMaterials(response.data);
      calculateStats(response.data);
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const calculateStats = (data) => {
    const stats = {
      totalBatches: data.length,
      inStock: data.filter(m => m.quantity > m.minimumQuantity).length,
      lowStock: data.filter(m => m.quantity <= m.minimumQuantity && m.quantity > 0).length,
      expired: data.filter(m => new Date(m.expiryDate) < new Date()).length
    };
    setStats(stats);
  };

  const handleAddType = async (typeData) => {
    try {
      await axios.post('/api/raw-materials/types', typeData);
      fetchMaterialTypes();
      setAddTypeModalOpen(false);
    } catch (error) {
      console.error('Error adding material type:', error);
    }
  };

  const handleAddBatch = async (batchData) => {
    try {
      await axios.post('/api/raw-materials/batches', batchData);
      fetchBatches();
      setAddBatchModalOpen(false);
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

        <div className="stats-container">
          <div className="stat-card">
            <span className="stat-label">Total Batches</span>
            <span className="stat-value total">{stats.totalBatches}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">In Stock</span>
            <span className="stat-value in-stock">{stats.inStock}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Low Stock</span>
            <span className="stat-value low-stock">{stats.lowStock}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Expired</span>
            <span className="stat-value expired">{stats.expired}</span>
          </div>
        </div>

        <div className="search-bar">
          <input 
            type="text" 
            placeholder="Search materials..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select 
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="all">All Types</option>
            {materialTypes.map(type => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
          <button className="filters-btn">Filters</button>
        </div>

        <table className="materials-table">
          <thead>
            <tr>
              <th>Batch ID</th>
              <th>Material Type</th>
              <th>Quantity</th>
              <th>Supplier</th>
              <th>Expiry Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((material) => (
              <tr key={material.id}>
                <td>{material.batchId}</td>
                <td>{material.type}</td>
                <td>{material.quantity} {material.unit}</td>
                <td>{material.supplier}</td>
                <td>{new Date(material.expiryDate).toLocaleDateString()}</td>
                <td>
                  <span className={`status-badge ${material.status.toLowerCase()}`}>
                    {material.status}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="edit-btn">Edit</button>
                    <button className="view-btn">View Details</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Add Type Modal */}
        <Modal isOpen={isAddTypeModalOpen} onClose={() => setAddTypeModalOpen(false)}>
          <AddTypeForm onSubmit={handleAddType} onClose={() => setAddTypeModalOpen(false)} />
        </Modal>

        {/* Add Batch Modal */}
        <Modal isOpen={isAddBatchModalOpen} onClose={() => setAddBatchModalOpen(false)}>
          <AddBatchForm 
            materialTypes={materialTypes}
            onSubmit={handleAddBatch} 
            onClose={() => setAddBatchModalOpen(false)}
          />
        </Modal>
      </div>
    </Layout>
  );
}

// Add Type Form Component
const AddTypeForm = ({ onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    minimumQuantity: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Add Material Type</h2>
      <div className="form-group">
        <label>Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
        />
      </div>
      <div className="form-group">
        <label>Unit</label>
        <input
          type="text"
          value={formData.unit}
          onChange={(e) => setFormData({...formData, unit: e.target.value})}
          required
        />
      </div>
      <div className="form-group">
        <label>Minimum Quantity</label>
        <input
          type="number"
          value={formData.minimumQuantity}
          onChange={(e) => setFormData({...formData, minimumQuantity: e.target.value})}
          required
        />
      </div>
      <div className="form-buttons">
        <button type="button" onClick={onClose}>Cancel</button>
        <button type="submit">Add Type</button>
      </div>
    </form>
  );
};

// Add Batch Form Component
const AddBatchForm = ({ materialTypes, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    typeId: '',
    quantity: '',
    supplier: '',
    expiryDate: '',
    batchNumber: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Add New Batch</h2>
      <div className="form-group">
        <label>Material Type</label>
        <select
          value={formData.typeId}
          onChange={(e) => setFormData({...formData, typeId: e.target.value})}
          required
        >
          <option value="">Select Type</option>
          {materialTypes.map(type => (
            <option key={type.id} value={type.id}>{type.name}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>Quantity</label>
        <input
          type="number"
          value={formData.quantity}
          onChange={(e) => setFormData({...formData, quantity: e.target.value})}
          required
        />
      </div>
      <div className="form-group">
        <label>Supplier</label>
        <input
          type="text"
          value={formData.supplier}
          onChange={(e) => setFormData({...formData, supplier: e.target.value})}
          required
        />
      </div>
      <div className="form-group">
        <label>Expiry Date</label>
        <input
          type="date"
          value={formData.expiryDate}
          onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
          required
        />
      </div>
      <div className="form-group">
        <label>Batch Number</label>
        <input
          type="text"
          value={formData.batchNumber}
          onChange={(e) => setFormData({...formData, batchNumber: e.target.value})}
          required
        />
      </div>
      <div className="form-buttons">
        <button type="button" onClick={onClose}>Cancel</button>
        <button type="submit">Add Batch</button>
      </div>
    </form>
  );
};

export default RawMaterials;