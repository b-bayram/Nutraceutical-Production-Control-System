import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import Layout from './Layout';
import Modal from './Modal';
import LoadingSpinner from '../assets/LoadingSpinner';
import BulkProductionModal from '../components/production/BulkProductionModal';
import ProductionColumn from '../components/production/DroppableColumn';
import ProductionDetailsModal from '../components/production/ProductionDetailsModal';
import { PRODUCTION_STAGES } from '../constants';
import { productionAPI } from '../services/api';
import { getStatusClass } from '../utils';

const ProductionQueue = () => {
  // State tanımlamaları
  const [productions, setProductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    preparation: 0,
    inProgress: 0,
    completed: 0
  });
  
  // Modal states
  const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
  const [isBulkProductionModalOpen, setBulkProductionModalOpen] = useState(false);
  const [selectedProduction, setSelectedProduction] = useState(null);

  useEffect(() => {
    console.log('Modal open state changed:', isBulkProductionModalOpen);
  }, [isBulkProductionModalOpen]);

  // Filter states
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    stage: '',
    productId: ''
  });

  useEffect(() => {
    fetchProductions();
  }, []);

  useEffect(() => {
    if (productions.length > 0) {
      calculateStats(productions);
    }
  }, [productions]);

  const fetchProductions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/productions`);
      const data = response.data.data || [];
      setProductions(data);
      calculateStats(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (productionId) => {
    try {
      const response = await axios.get(`${API_URL}/api/productions/${productionId}`);
      setSelectedProduction(response.data.data);
      setDetailsModalOpen(true);
    } catch (error) {
      console.error('Error fetching production details:', error);
    }
  };

  // Filter fonksiyonları
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await axios.get(`${API_URL}/api/productions/search?${params}`);
      setProductions(response.data.data || []);
    } catch (error) {
      console.error('Error searching productions:', error);
    }
  };

  // Helper fonksiyonlar
  const calculateStats = (data) => {
    const newStats = data.reduce((acc, curr) => {
      // Start with all possible stages set to 0
      if (!acc.total) {
        acc = {
          total: 0,
          preparation: 0,
          producing: 0,
          produced: 0,
          sent: 0,
          cancelled: 0
        };
      }
      
      // Increment total and specific stage counter
      acc.total += 1;
      acc[curr.stage] = (acc[curr.stage] || 0) + 1;
      
      return acc;
    }, {});
  
    setStats(newStats);
  };

  const getProductionsByStage = (stage) => {
    return productions.filter(p => p.stage === stage);
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-6">Production Queue</h1>
          
          {loading ? (
            <div className="grid grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white p-4 rounded-lg shadow animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Productions</p>
                    <p className="text-2xl font-bold text-blue-700">{stats.total || 0}</p>
                  </div>
                </div>
              </div>
  
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">In Preparation</p>
                    <p className="text-2xl font-bold text-yellow-700">{stats.preparation || 0}</p>
                  </div>
                </div>
              </div>
  
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Producing</p>
                    <p className="text-2xl font-bold text-purple-700">{stats.producing || 0}</p>
                  </div>
                </div>
              </div>
  
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Produced</p>
                    <p className="text-2xl font-bold text-green-700">{stats.produced || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
  
        {loading ? (
          <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-4 rounded-lg shadow animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-20 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            <ProductionColumn
              title="In Preparation"
              productions={getProductionsByStage(PRODUCTION_STAGES.PREPARATION)}
              onStartProduction={async (id) => {
                await productionAPI.startProduction(id);
                await fetchProductions();
              }}
              onComplete={async (id) => {
                await productionAPI.completeProduction(id);
                await fetchProductions();
              }}
              onViewDetails={handleViewDetails}
              onRefresh={fetchProductions}
            />
            <ProductionColumn
              title="Producing"
              productions={getProductionsByStage(PRODUCTION_STAGES.PRODUCING)}
              onStartProduction={async (id) => {
                await productionAPI.startProduction(id);
                await fetchProductions();
              }}
              onComplete={async (id) => {
                await productionAPI.completeProduction(id);
                await fetchProductions();
              }}
              onViewDetails={handleViewDetails}
              onRefresh={fetchProductions}
            />
            <ProductionColumn
              title="Produced"
              productions={getProductionsByStage(PRODUCTION_STAGES.PRODUCED)}
              onStartProduction={async (id) => {
                await productionAPI.startProduction(id);
                await fetchProductions();
              }}
              onComplete={async (id) => {
                await productionAPI.completeProduction(id);
                await fetchProductions();
              }}
              onViewDetails={handleViewDetails}
              onRefresh={fetchProductions}
            />
          </div>
        )}
  
        {/* Filter Section */}
        <div className="mt-8 mb-6 bg-white p-4 rounded-lg shadow">
          <div className="flex gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                name="stage"
                value={filters.stage}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
              >
                <option value="">All</option>
                <option value={PRODUCTION_STAGES.PREPARATION}>In Preparation</option>
                <option value={PRODUCTION_STAGES.PRODUCING}>Producing</option>
                <option value={PRODUCTION_STAGES.PRODUCED}>Produced</option>
                <option value={PRODUCTION_STAGES.SENT}>Sent</option>
                <option value={PRODUCTION_STAGES.CANCELLED}>Cancelled</option>
              </select>
            </div>
            <button
              onClick={handleSearch}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
            >
              Search
            </button>
            <button
              onClick={() => setBulkProductionModalOpen(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md ml-auto"
            >
              Start Bulk Production
            </button>
          </div>
        </div>
  
        {/* Production List Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center min-h-[200px] w-full">
              <LoadingSpinner />
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipe Version
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {productions.map((production) => (
                  <tr key={production.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{production.productName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">v{production.recipeVersion}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{production.quantity}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(production.stage)}`}>
                        {production.stage}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(production.startDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex gap-2">
                        {production.stage === PRODUCTION_STAGES.PREPARATION && (
                          <>
                            <button 
                              onClick={async () => {
                                try {
                                  await productionAPI.startProduction(production.id);
                                  await fetchProductions();
                                } catch (error) {
                                  console.error('Error starting production:', error);
                                  alert('Failed to start production: ' + error.message);
                                }
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Start
                            </button>
                            <button 
                              onClick={async () => {
                                if (!window.confirm('Are you sure you want to cancel this production?')) return;
                                try {
                                  await productionAPI.cancelProduction(production.id);
                                  await fetchProductions();
                                } catch (error) {
                                  console.error('Error canceling production:', error);
                                  alert('Failed to cancel production: ' + error.message);
                                }
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {production.stage === PRODUCTION_STAGES.PRODUCING && (
                          <button 
                            onClick={async () => {
                              try {
                                await productionAPI.completeProduction(production.id);
                                await fetchProductions();
                              } catch (error) {
                                console.error('Error completing production:', error);
                                alert('Failed to complete production: ' + error.message);
                              }
                            }}
                            className="text-green-600 hover:text-green-900"
                          >
                            Complete
                          </button>
                        )}
                        {production.stage === PRODUCTION_STAGES.PRODUCED && (
                          <button 
                            onClick={async () => {
                              try {
                                await productionAPI.sendProduction(production.id);
                                await fetchProductions();
                              } catch (error) {
                                console.error('Error sending production:', error);
                                alert('Failed to send production: ' + error.message);
                              }
                            }}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            Mark as Sent
                          </button>
                        )}
                        <button 
                          onClick={() => handleViewDetails(production.id)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
  
        {/* Modals */}
        <Modal isOpen={isDetailsModalOpen} onClose={() => setDetailsModalOpen(false)}>
          <ProductionDetailsModal 
            production={selectedProduction}
            onClose={() => setDetailsModalOpen(false)}
          />
        </Modal>
  
        <Modal isOpen={isBulkProductionModalOpen} onClose={() => setBulkProductionModalOpen(false)}>
          {isBulkProductionModalOpen && (
            <BulkProductionModal 
              onClose={() => setBulkProductionModalOpen(false)}
              onSuccess={() => {
                fetchProductions();
                setBulkProductionModalOpen(false);
              }}
            />
          )}
        </Modal>
      </div>
    </Layout>
  );
};

export default ProductionQueue;