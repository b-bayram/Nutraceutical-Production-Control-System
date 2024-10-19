import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'; // Import necessary components from react-router-dom
import Homepage from './pages/Homepage'; 
import Products from './pages/Products'; 

function App() {
  return (
    <Router>
      <Routes>
        {/* Define the route for the homepage */}
        <Route path="/" element={<Homepage/>} />
        <Route path="/Products" element={<Products/>} />
      </Routes>
    </Router>
  );
}

export default App;
