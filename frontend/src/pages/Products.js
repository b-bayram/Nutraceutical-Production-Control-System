import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import './Products.css';
import LoadingSpinner from '../assets/LoadingSpinner';
import axios from 'axios';
import Modal from './Modal';
import AddProduct from '../components/product/AddProduct';
import EditProduct from '../components/product/EditProduct';


function Products() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  //pagination variables
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 10;
  //pagination variable calculations
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(products.length / productsPerPage);
  //editModal
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

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
  
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inProduction: 0,
    outOfStock: 0
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setEditModalOpen(true);
  };

  const calculateStats = (productsData) => {
    const newStats = {
      total: productsData.length,
      active: productsData.filter(p => p.recipe).length, // has recipe
      inProduction: 0, // We'll need to implement this later TODO
      outOfStock: 0    // We'll need to implement this later TODO
    };
    setStats(newStats);
  };
  
  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:5001/api/products');
      const productsData = response.data.data || [];
      setProducts(productsData);
      calculateStats(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };


const handleExport = async () => {
  try {
    const response = await axios.get('http://localhost:5001/api/products');
    const productsData = response.data.data || [];
    
    const exportData = productsData.map(p => ({
      name: p.name,
      category: p.category,
      status: p.status,
      unitSize: p.unitSize
    }));
    
    const csvContent = "data:text/csv;charset=utf-8," + 
      Object.keys(exportData[0]).join(",") + "\n" +
      exportData.map(row => Object.values(row).join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "products.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error exporting products:', error);
  }
};
  
  const handleEditClick = async (productId) => {
    try {
      const response = await axios.get(`http://localhost:5001/api/products/${productId}`);
      if (response.data.success) {
        setSelectedProduct(response.data.data);
        // Open your edit modal here
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
    }
  };
  
  const handleViewRecipe = async (productId) => {
    try {
      const response = await axios.get(`http://localhost:5001/api/products/${productId}/recipe`);
      if (response.data.success) {
        // Open your recipe view modal with the data
        setSelectedProduct({...selectedProduct, recipe: response.data.data});
      }
    } catch (error) {
      console.error('Error fetching recipe:', error);
    }
  };

  const handleAddProduct = (newProduct) => {
    const updatedProducts = [...products, newProduct];
    setProducts(updatedProducts);
    calculateStats(updatedProducts);
  };

  const handleSearch = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/products/search', {
        params: {
          name: searchTerm,
          hasRecipe: selectedCategory !== 'All Categories' ? true : undefined
        }
      });
      if (response.data.success) {
        const productsData = response.data.data || [];
        setProducts(productsData);
        calculateStats(productsData);
      }
    } catch (error) {
      console.error('Error searching products:', error);
    }
  };

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };
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
      <Modal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)}>
        <AddProduct 
          isOpen={isAddModalOpen} 
          onClose={() => setAddModalOpen(false)} 
        />
      </Modal>
    );
  };
  

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
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (e.target.value === '') {
              fetchProducts(); // Reset to all products when search is cleared
            }
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
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
              <th>Description</th>
              <th>Recipe Version</th>
              <th>Recipe Details</th>
              <th>Created Date</th>
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
                      <button 
                        className="edit-btn"
                        onClick={() => handleEdit(product)}
                      >
                        Edit
                      </button>
                      <button 
                        className="view-btn"
                        onClick={() => handleViewRecipe(product.id)}
                      >
                        View Recipe
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/*loading screen*/}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="border-4 border-blue-500 border-t-transparent rounded-full w-16 h-16 animate-spin"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-lg text-red-600 my-4">
              {error}
            </div>
          ) : (
            <React.Fragment>
              {/* ... table content ... */}
              <div className="pagination">
                {/* ... pagination controls ... */}
              </div>
            </React.Fragment>
          )}

          <div className="pagination">
            <span className="showing-text">
              Showing {products.length === 0 ? 0 : indexOfFirstProduct + 1}-
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

          <AddProductModal 
            isOpen={isAddModalOpen}
            onClose={() => setAddModalOpen(false)}
            onAdd={handleAddProduct}
          />
          <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)}>
          <EditProduct 
            product={selectedProduct}
            onClose={() => {
              setEditModalOpen(false);
              setSelectedProduct(null);
              fetchProducts(); // Refresh the list after edit
            }}
  />
</Modal>
        </div>
      
    </Layout>
  );
}

export default Products;