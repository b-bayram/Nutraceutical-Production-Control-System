import React from 'react';
import Layout from './Layout';
import './Homepage.css'; 

function Homepage() {
  const listItems = ['Item 1', 'Item 2', 'Item 3', 'Item 4'];

  return (
    <Layout>
      {/* Upper Section */}
      <div className="upper-section">
        <h1>Welcome to the Homepage</h1>
      </div>

      {/* Lower Section - List */}
      <div className="lower-section">
        <ul>
          {listItems.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
    </Layout>
  );
}

export default Homepage;
