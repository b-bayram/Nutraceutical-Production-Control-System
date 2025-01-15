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
import RecipeManager from '../components/product/RecipeManager';
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
  const [isRecipeManagerOpen, setRecipeManagerOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);

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

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
        const response = await axios.get(`${API_URL}/api/products`);
        if (response.data.success) {
            const productsData = response.data.data;
            setProducts(productsData);
            calculateStats(productsData);
        }
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

  const handleAddProduct = (newProduct) => {
    const updatedProducts = [...products, newProduct];
    setProducts(updatedProducts);
    calculateStats(updatedProducts);
  };

  const handleSearch = async () => {
    try {
        setIsLoading(true);
        setError(null);
        
        let response;
        const searchUrl = searchTerm.trim() 
            ? `${API_URL}/api/products/search?query=${encodeURIComponent(searchTerm.trim())}`
            : `${API_URL}/api/products`;
        
        response = await axios.get(searchUrl);

        if (response.data.success) {
            const productsData = response.data.data;
            setProducts(productsData);
            calculateStats(productsData);
        }
    } catch (error) {
        console.error('Error searching products:', error);
        setError('Failed to search products. Please try again.');
    } finally {
        setIsLoading(false);
    }
  };

  // Add debounce effect for search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSearchInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleManageRecipes = (productId) => {
    setSelectedProductId(productId);
    setRecipeManagerOpen(true);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Products</h1>
          <div className="flex gap-2">
            <Button onClick={() => setAddModalOpen(true)}>
              Add Product
            </Button>
            <Button variant="outline" onClick={handleExport}>
              Export
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <Input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={handleSearchInputChange}
            className="max-w-md"
          />
        </div>

        <div className="stats grid grid-cols-4 gap-4 mb-6">
          <div className="stat bg-white p-4 rounded-lg shadow">
            <div className="stat-title text-gray-600">Total Products</div>
            <div className="stat-value text-3xl font-bold">{stats.total}</div>
          </div>
          <div className="stat bg-white p-4 rounded-lg shadow">
            <div className="stat-title text-gray-600">With Recipe</div>
            <div className="stat-value text-3xl font-bold">{stats.active}</div>
          </div>
          <div className="stat bg-white p-4 rounded-lg shadow">
            <div className="stat-title text-gray-600">In Production</div>
            <div className="stat-value text-3xl font-bold">{stats.inProduction}</div>
          </div>
          <div className="stat bg-white p-4 rounded-lg shadow">
            <div className="stat-title text-gray-600">Out of Stock</div>
            <div className="stat-value text-3xl font-bold">{stats.outOfStock}</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Name</th>
                <th className="py-2 px-4 border-b">Description</th>
                <th className="py-2 px-4 border-b">Recipe Status</th>
                <th className="py-2 px-4 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentProducts.map((product) => (
                <tr key={product.id}>
                  <td className="py-2 px-4 border-b">{product.name}</td>
                  <td className="py-2 px-4 border-b">{product.description}</td>
                  <td className="py-2 px-4 border-b">
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      product.recipe ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {product.recipe ? `v${product.recipe.version}` : 'No Recipe'}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleEdit(product)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleManageRecipes(product.id)}
                      >
                        Manage Recipes
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            {getPageNumbers().map((page, index) => (
              <Button
                key={index}
                variant={currentPage === page ? "default" : "outline"}
                onClick={() => typeof page === 'number' && setCurrentPage(page)}
                disabled={typeof page !== 'number'}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <LoadingSpinner />
          </div>
        )}

        {isAddModalOpen && (
          <Modal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)}>
            <AddProduct
              onClose={() => setAddModalOpen(false)}
              onProductAdded={handleAddProduct}
            />
          </Modal>
        )}

        {isEditModalOpen && selectedProduct && (
          <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)}>
            <EditProduct
              product={selectedProduct}
              materialTypes={materialTypes}
              onClose={() => {
                setEditModalOpen(false);
                fetchProducts();
              }}
            />
          </Modal>
        )}

        {isRecipeManagerOpen && (
          <Modal isOpen={isRecipeManagerOpen} onClose={() => setRecipeManagerOpen(false)}>
            <RecipeManager
              productId={selectedProductId}
              onClose={() => setRecipeManagerOpen(false)}
            />
          </Modal>
        )}
      </div>
    </Layout>
  );
}

export default Products;