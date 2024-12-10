import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import Modal from './Modal';

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

  // API fonksiyonları
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
      await axios.put(`http://localhost:5001/api/productions/${productionId}/stage`, {
        stage: newStage
      });
      await fetchProductions();
    } catch (error) {
      console.error('Error updating stage:', error);
    }
  };

  const handleCancelProduction = async (productionId) => {
    if (!window.confirm('Are you sure you want to cancel this production?')) return;
    try {
      await axios.post(`http://localhost:5001/api/productions/${productionId}/cancel`);
      await fetchProductions();
    } catch (error) {
      console.error('Error canceling production:', error);
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
    const newStats = data.reduce((acc, curr) => ({
      ...acc,
      [curr.stage]: (acc[curr.stage] || 0) + 1,
      total: acc.total + 1
    }), { total: 0, preparation: 0, inProgress: 0, completed: 0 });
    setStats(newStats);
  };

  const getProductionsByStage = (stage) => {
    return productions.filter(p => p.stage === stage);
  };

  const getStatusClass = (stage) => {
    const classes = {
      preparation: 'bg-yellow-100 text-yellow-800',
      inProgress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800'
    };
    return classes[stage] || '';
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const stages = {
      preparation: 'preparation',
      inProgress: 'inProgress',
      completed: 'completed'
    };

    const productionId = result.draggableId;
    const newStage = stages[result.destination.droppableId];

    try {
      await axios.put(`http://localhost:5001/api/productions/${productionId}/stage`, {
        stage: newStage
      });
      fetchProductions();
    } catch (error) {
      console.error('Error updating stage:', error);
    }
  };

  // ProductionCard Component
  const ProductionCard = ({ production }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-lg text-gray-800">{production.productName}</h3>
        <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(production.stage)}`}>
          {production.stage}
        </span>
      </div>
      
      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span>Quantity: {production.quantity}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Recipe v{production.recipeVersion}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>{new Date(production.startDate).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="flex justify-between items-center mt-4 pt-3 border-t">
        <button 
          onClick={() => handleViewDetails(production.id)}
          className="text-gray-600 hover:text-gray-800 text-sm"
        >
          View Details
        </button>
        {production.stage === 'preparation' && (
          <button
            onClick={() => handleStageUpdate(production.id, 'inProgress')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm"
          >
            Start Production
          </button>
        )}
        {production.stage === 'inProgress' && (
          <button
            onClick={() => handleStageUpdate(production.id, 'completed')}
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm"
          >
            Complete
          </button>
        )}
      </div>
    </div>
  );

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

  const BulkProductionModal = ({ onClose }) => (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Start Bulk Production</h2>
      <div className="mt-6 flex justify-end gap-2">
        <button 
          onClick={onClose}
          className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md"
        >
          Cancel
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
                  <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">In Preparation</p>
                  <p className="text-2xl font-bold text-yellow-700">{stats.preparation}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-purple-700">{stats.inProgress}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">In Preparation</h2>
                <span className="px-2 py-1 bg-gray-200 rounded-full text-sm">
                  {getProductionsByStage('preparation').length}
                </span>
              </div>
              <Droppable droppableId="preparation">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-4"
                  >
                    {getProductionsByStage('preparation').map((production, index) => (
                      <Draggable
                        key={production.id}
                        draggableId={production.id.toString()}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <ProductionCard production={production} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">In Progress</h2>
                <span className="px-2 py-1 bg-gray-200 rounded-full text-sm">
                  {getProductionsByStage('inProgress').length}
                </span>
              </div>
              <Droppable droppableId="inProgress">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-4"
                  >
                    {getProductionsByStage('inProgress').map((production, index) => (
                      <Draggable
                        key={production.id}
                        draggableId={production.id.toString()}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <ProductionCard production={production} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">Completed</h2>
                <span className="px-2 py-1 bg-gray-200 rounded-full text-sm">
                  {getProductionsByStage('completed').length}
                </span>
              </div>
              <Droppable droppableId="completed">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-4"
                  >
                    {getProductionsByStage('completed').map((production, index) => (
                      <Draggable
                        key={production.id}
                        draggableId={production.id.toString()}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <ProductionCard production={production} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
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
                <option value="preparation">In Preparation</option>
                <option value="inProgress">In Progress</option>
                <option value="completed">Completed</option>
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
                            onClick={() => handleStageUpdate(production.id, 'inProgress')}
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
          <BulkProductionModal 
            onClose={() => setBulkProductionModalOpen(false)}
          />
        </Modal>
      </div>
    </Layout>
  );
};

export default ProductionQueue;