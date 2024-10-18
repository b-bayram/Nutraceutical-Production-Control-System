// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'; // Import necessary components from react-router-dom
import Homepage from './pages/Homepage'; // Import the new Homepage component


function App() {
  return (
    <Router>
      <Routes>
        {/* Define the route for the homepage */}
        <Route path="/" element={<Homepage />} />
      </Routes>
    </Router>
  );
}

export default App;
