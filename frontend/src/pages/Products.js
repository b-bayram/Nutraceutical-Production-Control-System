import React, { useState } from 'react';
import Layout from './Layout';
import './Products.css';
import axios from 'axios'; // Import axios for HTTP requests

function Products() {
  const [productName, setProductName] = useState(''); // State to store the user input

  const handleInputChange = (event) => {
    setProductName(event.target.value); // Update state on input change
  };

  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent page refresh on form submission

    // Send HTTP request to your backend
    try {
      const response = await axios.post('http://your-backend-url/api/products', {
        name: productName, // Sending product name
      });

      console.log('Product saved:', response.data); // Handle successful response
      setProductName(''); // Clear the input after submission
    } catch (error) {
      console.error('Error saving product:', error); // Handle error
    }
  };

  return (
    <Layout>
      <div className='products-upperbar'>
        <h1>Products</h1>

        {/* Form for user input */}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={productName}
            onChange={handleInputChange}
            placeholder="Enter product name"
            required // Make it a required field
          />
          <button type="submit">Add Product</button>
        </form>

        <p></p>
      </div>
    </Layout>
  );
}

export default Products;
