import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import Layout from './Layout';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import './Products.css';
import LoadingSpinner from '../assets/LoadingSpinner';
import axios from 'axios';
import Modal from './Modal';
import AddProduct from '../components/product/AddProduct';
import EditProduct from '../components/product/EditProduct';
import ViewRecipe from '../components/product/ViewRecipe';
import FilterPanel from '../components/product/FilterPanel';

function Products() {
  console.log("API URL being used:", API_URL);
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
  //
  const [materialTypes, setMaterialTypes] = useState([]);
  const [isViewRecipeModalOpen, setViewRecipeModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

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
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    name: '',
    hasRecipe: '',
    createdAfter: '',
    createdBefore: ''
  });

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inProduction: 0,
    outOfStock: 0
  });
  const handleResetFilters = () => {
    setSearchFilters({
      name: '',
      hasRecipe: '',
      createdAfter: '',
      createdBefore: ''
    });
    fetchProducts(); // Reset to all products
  };
      
  useEffect(() => {
    const fetchMaterialTypes = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/raw-materials/types`);
        if (response.data.success) {
          setMaterialTypes(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching material types:', error);
      }
    };
  
    fetchMaterialTypes();
  }, []);

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
  
  const handleStartProduction = async (recipe) => {
    try {
      const productionData = {
        productTemplateId: recipe.templateId,
        quantity: 1, // You might want to add a quantity input
        selectedMaterials: recipe.materials.map(material => ({
          batchId: material.materialTypeId,
          amountUsed: material.amountInGrams
        }))
      };
  
      const response = await axios.post(`${API_URL}/api/productions`, productionData);
      if (response.data.success) {
        setViewRecipeModalOpen(false);
        // Optionally add a success notification here
      }
    } catch (error) {
      console.error('Error starting production:', error);
    }
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // First get all products
      const response = await axios.get(`${API_URL}/api/products`);
      const productsData = response.data.data || [];
  
      // Then get active recipes for each product
      const productsWithRecipes = await Promise.all(
        productsData.map(async (product) => {
          try {
            const recipeResponse = await axios.get(`${API_URL}/api/products/${product.id}/recipe`);
            return {
              ...product,
              recipeVersion: recipeResponse.data.data?.version,
              recipeStatus: recipeResponse.data.data?.isActive ? 'Active' : 'Inactive'
            };
          } catch (error) {
            return {
              ...product,
              recipeVersion: 'No Recipe',
              recipeStatus: 'No Recipe'
            };
          }
        })
      );
  
      setProducts(productsWithRecipes);
      calculateStats(productsWithRecipes);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  

const handleExport = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/products`);
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
      const response = await axios.get(`${API_URL}/api/products/${productId}`);
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
      const response = await axios.get(`${API_URL}/api/products/${productId}/recipe`);
      if (response.data.success) {
        setSelectedRecipe(response.data.data);
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
      setIsLoading(true);
      setError(null);
      
      // Only use name parameter for search as that's what backend expects
      let endpoint = `${API_URL}/api/products`;
      
      if (searchFilters.name?.trim()) {
        endpoint = `${API_URL}/api/products/search?name=${encodeURIComponent(searchFilters.name.trim())}`;
      }
  
      if (searchFilters.hasRecipe && searchFilters.hasRecipe !== 'all') {
        endpoint += `${endpoint.includes('?') ? '&' : '?'}hasRecipe=${searchFilters.hasRecipe}`;
      }
  
      const response = await axios.get(endpoint);
      
      // Filter results client-side for date range since backend doesn't support it
      let filteredData = response.data.data;
      
      if (searchFilters.createdAfter) {
        filteredData = filteredData.filter(product => 
          new Date(product.createdAt) >= new Date(searchFilters.createdAfter)
        );
      }
      
      if (searchFilters.createdBefore) {
        filteredData = filteredData.filter(product => 
          new Date(product.createdAt) <= new Date(searchFilters.createdBefore)
        );
      }
  
      setProducts(filteredData);
      calculateStats(filteredData);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error searching products:', error);
      setError('Failed to search products. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchFilters(prev => ({
      ...prev,
      name: value
    }));
    
    // Clear existing timeout
    if (window.searchTimeout) {
      clearTimeout(window.searchTimeout);
    }
    
    // If search is cleared, show all products
    if (!value.trim()) {
      fetchProducts();
      return;
    }
    
    // Set new timeout for search
    window.searchTimeout = setTimeout(() => {
      handleSearch();
    }, 500); // Wait 500ms after user stops typing before searching
  };

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };
  

  return (
    <Layout>
      
        <div className="products-page">
          <div className="header">
            <h1>Products</h1>
            <div className="header-buttons">
              <button 
                className="add-btn"
                onClick={() => {
                  console.log('Opening add modal');
                  setAddModalOpen(true);
                }}
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

          <div className="search-section relative mb-6"> {/* Add container with relative positioning */}
            <div className="search-bar-wrapper flex items-center gap-4 mb-2">
              <div className="flex-1">
                <Input 
                  type="text" 
                  placeholder="Search products..." 
                  value={searchFilters.name}
                  onChange={handleSearchInputChange}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                />
              </div>
              <Button 
                onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                variant="outline"
              >
                {isFilterPanelOpen ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </div>

            {error && (
              <div className="bg-red-50 p-4 rounded-lg text-red-600 mb-4">
                {error}
              </div>
            )}

            {isFilterPanelOpen && (
              <div className="filter-panel-wrapper bg-white border rounded-lg shadow-lg p-4 mb-4">
                <FilterPanel
                  filters={searchFilters}
                  onChange={setSearchFilters}
                  onApply={handleSearch}
                  onReset={handleResetFilters}
                />
              </div>
            )}
          </div>
          

          <table className="products-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Description</th>
                <th>Recipe Version</th>
                <th>Recipe Status</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div>
                      <p className="font-medium">{product.name}</p>
                    </div>
                              </td>
                              <td>{product.description}</td>
                              <td>
                    {product.recipeVersion === 'No Recipe' ? (
                      <span className="text-gray-500">No Recipe</span>
                    ) : (
                      <span className="font-medium">v{product.recipeVersion}</span>
                    )}
                  </td>
                  <td>
                    {product.recipeStatus === 'No Recipe' ? (
                      <span className="px-2 py-1 rounded-full text-sm bg-gray-100 text-gray-800">
                        No Recipe
                      </span>
                    ) : (
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        product.recipeStatus === 'Active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {product.recipeStatus}
                      </span>
                    )}
                  </td>
                  <td>{new Date(product.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEdit(product)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                      {product.hasActiveRecipe && (
                        <button 
                          onClick={async () => {
                            try {
                              const recipeResponse = await axios.get(`${API_URL}/api/products/${product.id}/recipe`);
                              if (recipeResponse.data.success) {
                                setSelectedRecipe(recipeResponse.data.data);
                                setViewRecipeModalOpen(true);
                              }
                            } catch (error) {
                              console.error('Error fetching recipe:', error);
                            }
                          }}
                          className="text-green-600 hover:text-green-800"
                        >
                          View Recipe
                        </button>
                      )}
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
          <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)}>
            <EditProduct 
              product={selectedProduct}
              materialTypes={materialTypes}
              onClose={() => {
                setEditModalOpen(false);
                setSelectedProduct(null);
                fetchProducts(); // This will refresh the products list
              }}
            />
          </Modal>
          <Modal isOpen={isViewRecipeModalOpen} onClose={() => setViewRecipeModalOpen(false)}>
            <ViewRecipe 
              recipe={selectedRecipe}
              onClose={() => setViewRecipeModalOpen(false)}
              onStartProduction={handleStartProduction}
            />
          </Modal>
          <Modal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)}>
            <AddProduct 
              materialTypes={materialTypes}
              onClose={() => setAddModalOpen(false)}
              onAdd={handleAddProduct}
            />
          </Modal>
        </div>
      
    </Layout>
  );
}

export default Products;