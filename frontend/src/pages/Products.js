import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import './Products.css';
import axios from 'axios';
import Modal from './Modal'; // Import the modal component

function Products() {
  const [products, setProducts] = useState([]); // State to store products
  const [productName, setProductName] = useState(''); // State for adding product
  const [selectedProductId, setSelectedProductId] = useState(null); // State for selected product to delete
  const [isAddModalOpen, setAddModalOpen] = useState(false); // State for add modal
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false); // State for delete modal

  // Fetch products when the component mounts
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/products');
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, []);

  // Handle input change for the new product
  const handleInputChange = (event) => {
    setProductName(event.target.value);
  };

  // Handle add product form submission
  const handleAddSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/products', {
        name: productName,
      });
      setProducts([...products, { id: response.data.productId, name: productName }]);
      setProductName('');
      setAddModalOpen(false); // Close the modal after adding
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  // Handle delete product confirmation
  const handleDeleteProduct = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/products/${selectedProductId}`);
      setProducts(products.filter((product) => product.id !== selectedProductId));
      setSelectedProductId(null);
      setDeleteModalOpen(false); // Close the modal after deletion
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  return (
    <Layout>
      <div className='products-upperbar'>
        <h1>Products</h1>

        <button className="add-product-btn" onClick={() => setAddModalOpen(true)}>Add Product</button>

        {/* List of products */}
        <ul className="products-container">
          {products.map((product) => (
            <li key={product.id} className="product-item">
              <span className="product-name">{product.name}</span>
              <button
                className="delete-btn"
                onClick={() => {
                  setSelectedProductId(product.id);
                  setDeleteModalOpen(true);
                }}
              >
                &times;
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Add Product Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)}>
        <h2>Add Product</h2>
        <form onSubmit={handleAddSubmit}>
          <input
            type="text"
            value={productName}
            onChange={handleInputChange}
            placeholder="Enter product name"
            required
          />
          <button type="submit">Add Product</button>
        </form>
      </Modal>

      {/* Delete Product Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <h2>Confirm Deletion</h2>
        <p>Are you sure you want to delete this product?</p>
        <button onClick={handleDeleteProduct}>Yes, Delete</button>
        <button onClick={() => setDeleteModalOpen(false)}>Cancel</button>
      </Modal>
    </Layout>
  );
}

export default Products;
