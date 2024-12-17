import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import Modal from './Modal';
import BulkProductionModal from '../components/production/BulkProductionModal';

const PRODUCTION_STAGES = {
  PREPARATION: 'preparation',
  PRODUCING: 'producing',
  PRODUCED: 'produced',
  SENT: 'sent',
  CANCELLED: 'cancelled'
};


// API Service
// Update the productionAPI object
const productionAPI = {
  updateStage: async (productionId, newStage) => {
    try {
      const response = await axios.put(`http://localhost:5001/api/productions/${productionId}/stage`, {
        stage: newStage
      });
      return response.data;
    } catch (error) {
      console.error('Production stage update error:', error.response?.data || error.message);
      throw error;
    }
  },
  
  startProduction: async (productionId) => {
    return productionAPI.updateStage(productionId, PRODUCTION_STAGES.PRODUCING);
  },
  
  completeProduction: async (productionId) => {
    return productionAPI.updateStage(productionId, PRODUCTION_STAGES.PRODUCED);
  },

  sendProduction: async (productionId) => {
    return productionAPI.updateStage(productionId, PRODUCTION_STAGES.SENT);
  },
  
  cancelProduction: async (productionId) => {
    return productionAPI.updateStage(productionId, PRODUCTION_STAGES.CANCELLED);
  }
};




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

  // API fonksiyonları
  const DroppableColumn = ({ title, productions, droppableId }) => (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg">{title}</h2>
        <span className="px-2 py-1 bg-gray-200 rounded-full text-sm">
          {productions.length}
        </span>
      </div>
      <Droppable droppableId={droppableId}>
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="space-y-4 min-h-[200px]"
          >
            {productions.map((production, index) => (
              <Draggable
                key={production.id}
                draggableId={String(production.id)}
                index={index}
                isDragDisabled={production.stage === PRODUCTION_STAGES.SENT || 
                              production.stage === PRODUCTION_STAGES.CANCELLED}
              >
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`bg-white p-4 rounded-lg shadow-sm ${
                      production.stage === PRODUCTION_STAGES.SENT || 
                      production.stage === PRODUCTION_STAGES.CANCELLED ? 
                      'opacity-50' : ''
                    }`}
                  >
                    <ProductionCard 
                      production={production}
                      onStartProduction={async (id) => {
                        await productionAPI.startProduction(id);
                        await fetchProductions();
                      }}
                      onComplete={async (id) => {
                        await productionAPI.completeProduction(id);
                        await fetchProductions();
                      }}
                      onViewDetails={handleViewDetails}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );

  const fetchProductions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5001/api/productions');
      const data = response.data.data || [];
      setProductions(data);
      calculateStats(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStageUpdate = async (productionId, newStage) => {
    try {
      const response = await productionAPI.updateStage(productionId, newStage);
      if (response.success) {
        await fetchProductions();
      }
    } catch (error) {
      console.error('Error updating stage:', error);
      alert('Failed to update production stage: ' + error.message);
    }
  };

  const handleStart = async (productionId) => {
    try {
      await handleStageUpdate(productionId, 'inProgress');
    } catch (error) {
      console.error('Error starting production:', error);
    }
  };

  const handleCancelProduction = async (productionId) => {
    if (!window.confirm('Are you sure you want to cancel this production?')) return;
    try {
      const response = await productionAPI.cancelProduction(productionId);
      if (response.success) {
        await fetchProductions();
      }
    } catch (error) {
      console.error('Error canceling production:', error);
      alert('Failed to cancel production: ' + error.message);
    }
  };

  const handleViewDetails = async (productionId) => {
    try {
      const response = await axios.get(`http://localhost:5001/api/productions/${productionId}`);
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
      
      const response = await axios.get(`http://localhost:5001/api/productions/search?${params}`);
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

  const getStatusClass = (stage) => {
    const classes = {
      [PRODUCTION_STAGES.PREPARATION]: 'bg-yellow-100 text-yellow-800',
      [PRODUCTION_STAGES.PRODUCING]: 'bg-blue-100 text-blue-800',
      [PRODUCTION_STAGES.PRODUCED]: 'bg-green-100 text-green-800',
      [PRODUCTION_STAGES.SENT]: 'bg-purple-100 text-purple-800',
      [PRODUCTION_STAGES.CANCELLED]: 'bg-red-100 text-red-800'
    };
    return classes[stage] || '';
  };
  
  const handleDragEnd = async (result) => {
    if (!result.destination) return;
  
    const stages = {
      [PRODUCTION_STAGES.PREPARATION]: PRODUCTION_STAGES.PREPARATION,
      [PRODUCTION_STAGES.PRODUCING]: PRODUCTION_STAGES.PRODUCING,
      [PRODUCTION_STAGES.PRODUCED]: PRODUCTION_STAGES.PRODUCED
    };
  
    const productionId = parseInt(result.draggableId);
    const newStage = stages[result.destination.droppableId];
  
    // Add validation for allowed transitions
    const currentStage = productions.find(p => p.id === productionId)?.stage;
    
    // Only allow specific transitions
    const allowedTransitions = {
      [PRODUCTION_STAGES.PREPARATION]: [PRODUCTION_STAGES.PRODUCING],
      [PRODUCTION_STAGES.PRODUCING]: [PRODUCTION_STAGES.PRODUCED],
      [PRODUCTION_STAGES.PRODUCED]: [PRODUCTION_STAGES.SENT]
    };
  
    if (!allowedTransitions[currentStage]?.includes(newStage)) {
      alert('Invalid stage transition');
      return;
    }
  
    try {
      await productionAPI.updateStage(productionId, newStage);
      await fetchProductions();
    } catch (error) {
      console.error('Error updating stage:', error);
      alert('Failed to update production stage: ' + error.message);
    }
  };
 // ProductionQueue.js içindeki ProductionCard bileşenini güncelleyelim

 const ProductionCard = ({ production, onStartProduction, onComplete, onViewDetails }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async () => {
    try {
      setIsLoading(true);
      await onStartProduction(production.id);
    } catch (error) {
      console.error('Error starting production:', error);
      alert('Failed to start production: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-lg text-gray-800">
          {production.productName}
        </h3>
        <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(production.stage)}`}>
          {production.stage}
        </span>
      </div>
      
      <div className="space-y-2 text-sm text-gray-600">
        <div>Quantity: {production.quantity}</div>
        <div>Recipe v{production.recipeVersion}</div>
        <div>{new Date(production.startDate).toLocaleDateString()}</div>
      </div>

      <div className="flex justify-between items-center mt-4 pt-3 border-t">
        <button 
          onClick={() => onViewDetails(production.id)}
          className="text-gray-600 hover:text-gray-800 text-sm"
        >
          View Details
        </button>
        
        {production.stage === PRODUCTION_STAGES.PREPARATION && (
          <button
            onClick={handleStart}
            disabled={isLoading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Starting...
              </div>
            ) : (
              'Start Production'
            )}
          </button>
        )}

        {production.stage === PRODUCTION_STAGES.PRODUCING && (
          <button
            onClick={() => onComplete(production.id)}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm"
          >
            Complete
          </button>
        )}

        {production.stage === PRODUCTION_STAGES.PRODUCED && (
          <button
            onClick={() => productionAPI.updateStage(production.id, PRODUCTION_STAGES.SENT)}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md text-sm"
          >
            Mark as Sent
          </button>
        )}
      </div>
    </div>
  );
};

  // Modal Components
  const ProductionDetailsModal = ({ production, onClose }) => (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Production Details</h2>
      <div className="space-y-4">
        <div>
          <label className="font-medium">Product Name:</label>
          <p>{production?.productName}</p>
        </div>
        <div>
          <label className="font-medium">Recipe Version:</label>
          <p>v{production?.recipeVersion}</p>
        </div>
        <div>
          <label className="font-medium">Quantity:</label>
          <p>{production?.quantity}</p>
        </div>
        <div>
          <label className="font-medium">Status:</label>
          <p>{production?.stage}</p>
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <button 
          onClick={onClose}
          className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md"
        >
          Close
        </button>
      </div>
    </div>
  );

 

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-6">Production Queue</h1>
          
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Productions</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {stats.total || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">In Preparation</p>
                  <p className="text-2xl font-bold text-yellow-700">
                    {stats.preparation || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Producing</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {stats.producing || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Produced</p>
                  <p className="text-2xl font-bold text-green-700">
                    {stats.produced || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-3 gap-6">
            <DroppableColumn
              title="In Preparation"
              productions={getProductionsByStage(PRODUCTION_STAGES.PREPARATION)}
              droppableId={PRODUCTION_STAGES.PREPARATION}
            />
            <DroppableColumn
              title="Producing"
              productions={getProductionsByStage(PRODUCTION_STAGES.PRODUCING)}
              droppableId={PRODUCTION_STAGES.PRODUCING}
            />
            <DroppableColumn
              title="Produced"
              productions={getProductionsByStage(PRODUCTION_STAGES.PRODUCED)}
              droppableId={PRODUCTION_STAGES.PRODUCED}
            />
          </div>
        </DragDropContext>
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
              onClick={() => {
                console.log('Button clicked'); // Add this log
                setBulkProductionModalOpen(true);
              }}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md ml-auto"
            >
              Start Bulk Production
            </button>
          </div>
        </div>

        {/* Production List Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recipe Version
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                      {production.stage === 'preparation' && (
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
                            onClick={() => handleCancelProduction(production.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {production.stage === 'inProgress' && (
                        <button 
                          onClick={() => handleStageUpdate(production.id, 'completed')}
                          className="text-green-600 hover:text-green-900"
                        >
                          Complete
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
        </div>

        {/* Modals */}
        <Modal isOpen={isDetailsModalOpen} onClose={() => setDetailsModalOpen(false)}>
          <ProductionDetailsModal 
            production={selectedProduction}
            onClose={() => setDetailsModalOpen(false)}
          />
        </Modal>

        <Modal isOpen={isBulkProductionModalOpen} onClose={() => setBulkProductionModalOpen(false)}>
          {isBulkProductionModalOpen && (  // Add this conditional render
            <BulkProductionModal 
              onClose={() => {
                setBulkProductionModalOpen(false);
              }}
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