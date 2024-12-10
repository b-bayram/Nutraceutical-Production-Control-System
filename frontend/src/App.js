import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Homepage from './pages/Homepage';
import Products from './pages/Products';
import RawMaterials from './pages/RawMaterials';
import ProductionQueue from './pages/ProductionQueue';  // Yeni import

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage/>} />
        <Route path="/products" element={<Products/>} />
        <Route path="/raw-materials" element={<RawMaterials/>} />
        <Route path="/production-queue" element={<ProductionQueue/>} />  {/* Yeni route */}
      </Routes>
    </Router>
  );
}

export default App;