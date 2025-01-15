import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './pages/Layout';
import Homepage from './pages/Homepage';
import Products from './pages/Products';
import RawMaterials from './pages/RawMaterials';
import ProductionQueue from './pages/ProductionQueue';
import HelpAndSupport from './pages/HelpAndSupport';
import Login from './pages/Login';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" />;
  }

  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          localStorage.getItem('token') ? <Navigate to="/" /> : <Login />
        } />
        
        <Route path="/" element={
          <PrivateRoute>
            <Homepage />
          </PrivateRoute>
        } />
        
        <Route path="/products" element={
          <PrivateRoute>
            <Products />
          </PrivateRoute>
        } />
        
        <Route path="/raw-materials" element={
          <PrivateRoute>
            <RawMaterials />
          </PrivateRoute>
        } />
        
        <Route path="/production-queue" element={
          <PrivateRoute>
            <ProductionQueue />
          </PrivateRoute>
        } />

        <Route path="/help-support" element={
          <PrivateRoute>
            <HelpAndSupport />
          </PrivateRoute>
        } />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;