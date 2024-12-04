import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import './Products.css';
import axios from 'axios';
import Modal from './Modal';

const AddProductModal = ({ isOpen, onClose, onAdd }) => {
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Tablets',
    unitSize: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5001/api/products', newProduct);
      onAdd(response.data);
      onClose();
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };
  

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2>Add New Product</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Product Name</label>
          <input
            type="text"
            value={newProduct.name}
            onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
            required
          />
        </div>
        <div className="form-group">
          <label>Category</label>
          <select
            value={newProduct.category}
            onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
            required
          >
            <option value="Tablets">Tablets</option>
            <option value="Capsules">Capsules</option>
          </select>
        </div>
        <div className="form-group">
          <label>Unit Size</label>
          <input
            type="text"
            value={newProduct.unitSize}
            onChange={(e) => setNewProduct({...newProduct, unitSize: e.target.value})}
            required
          />
        </div>
        <div className="form-buttons">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit">Add Product</button>
        </div>
      </form>
    </Modal>
  );
};

function Products() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const productsPerPage = 10;

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inProduction: 0,
    outOfStock: 0
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const calculateStats = (productsData) => {
    const newStats = {
      total: productsData.length,
      active: productsData.filter(p => p.status === 'Active').length,
      inProduction: productsData.filter(p => p.status === 'In Production').length,
      outOfStock: productsData.filter(p => p.status === 'Out of Stock').length
    };
    setStats(newStats);
  };
  
  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/products');
      // Check if the response data is an array
      const productsData = Array.isArray(response.data) ? response.data : [];
      setProducts(productsData);
      calculateStats(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleExport = () => {
    const exportData = products.map(p => ({
      name: p.name,
      sku: p.sku,
      category: p.category,
      status: p.status
    }));
    
    const csvContent = "data:text/csv;charset=utf-8," + 
      Object.keys(exportData[0]).join(",") + "\n" +
      exportData.map(row => Object.values(row).join(",")).join("\n");
      
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "products.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddProduct = (newProduct) => {
    const updatedProducts = [...products, newProduct];
    setProducts(updatedProducts);
    calculateStats(updatedProducts);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > Math.ceil(products.length / productsPerPage)) return;
    setCurrentPage(page);
  };

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);

  return (
    <Layout>
      
        <div className="products-page">
          <div className="header">
            <h1>Products</h1>
            <div className="header-buttons">
              <button 
                className="add-btn"
                onClick={() => setAddModalOpen(true)}
              >
                Add New Product
              </button>
              <button 
                className="export-btn" 
                onClick={handleExport}
              >
                Export
              </button>
            </div>
          </div>

          <div className="stats-container">
            <div className="stat-card">
              <span className="stat-label">Total Products</span>
              <span className="stat-value total">{stats.total}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Active Products</span>
              <span className="stat-value active">{stats.active}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">In Production</span>
              <span className="stat-value production">{stats.inProduction}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Out of Stock</span>
              <span className="stat-value out-of-stock">{stats.outOfStock}</span>
            </div>
          </div>

          <div className="search-bar">
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchTerm}
              onChange={handleSearch}
            />
            <select value={selectedCategory} onChange={handleCategoryChange}>
              <option>All Categories</option>
              <option>Tablets</option>
              <option>Capsules</option>
            </select>
            <button className="filters-btn">Filters</button>
          </div>

          <table className="products-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Category</th>
                <th>Recipe Details</th>
                <th>Unit Size</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="product-name">
                      {product.name}
                      <span className="sku">SKU: {product.sku}</span>
                    </div>
                  </td>
                  <td>{product.category}</td>
                  <td>
                    <ul className="recipe-details">
                      {product.recipe?.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </td>
                  <td>{product.unitSize}</td>
                  <td>
                    <span className={`status-badge ${product.status?.toLowerCase()}`}>
                      {product.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="edit-btn">Edit</button>
                      <button className="view-btn">View Recipe</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <span className="showing-text">
              Showing {indexOfFirstProduct + 1}-
              {Math.min(indexOfLastProduct, products.length)} of {products.length} products
            </span>
            <div className="page-buttons">
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="page-btn"
              >
                Previous
              </button>
              {[1, 2, 3].map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`page-btn ${currentPage === page ? 'active' : ''}`}
                >
                  {page}
                </button>
              ))}
              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= Math.ceil(products.length / productsPerPage)}
                className="page-btn"
              >
                Next
              </button>
            </div>
          </div>

          <AddProductModal 
            isOpen={isAddModalOpen}
            onClose={() => setAddModalOpen(false)}
            onAdd={handleAddProduct}
          />
        </div>
      
    </Layout>
  );
}

export default Products;