import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { Plus, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import Layout from './Layout';
import axios from 'axios';
import './Homepage.css';
import CalendarDayModal from '../components/calendar/CalendarDayModal';
import { useNavigate } from 'react-router-dom';

function Homepage() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDayInfo, setSelectedDayInfo] = useState(null);
  const [products, setProducts] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [productions, setProductions] = useState([]);

  useEffect(() => {
    // Fetch initial data
    fetchProducts();
    fetchRawMaterials();
    fetchProductions();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/products`);
      if (response.data.success) {
        // Get the first 3 products from the response
        setProducts(response.data.data.slice(0, 3).map(product => ({
          id: product.id,
          name: product.name,
          stock: product.templateCount || 0 // Using templateCount as a measure of available recipes
        })));
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      // Keep the mock data as fallback
      setProducts([
        { id: 1, name: 'Vitamin C Supplement', stock: 150 },
        { id: 2, name: 'Protein Powder', stock: 200 },
        { id: 3, name: 'Omega-3 Fish Oil', stock: 100 }
      ]);
    }
  };

  const fetchRawMaterials = async () => {
    try {
      // First get the raw material types
      const typesResponse = await axios.get(`${API_URL}/api/raw-materials/types`);
      if (typesResponse.data.success) {
        // Then get the batches to calculate total stock for each type
        const batchesResponse = await axios.get(`${API_URL}/api/raw-materials/batches`);
        if (batchesResponse.data.success) {
          // Create a map to store total stock for each material type
          const stockMap = {};
          batchesResponse.data.data.forEach(batch => {
            if (!stockMap[batch.typeId]) {
              stockMap[batch.typeId] = 0;
            }
            stockMap[batch.typeId] += Number(batch.remainingAmount) || 0;
          });

          // Map the first 3 material types with their total stock
          const materials = typesResponse.data.data.slice(0, 3).map(type => ({
            id: type.id,
            name: type.name,
            stock: Math.round(stockMap[type.id] || 0)
          }));

          setRawMaterials(materials);
        }
      }
    } catch (error) {
      console.error('Error fetching raw materials:', error);
      // Keep the mock data as fallback
      setRawMaterials([
        { id: 1, name: 'Ascorbic Acid', stock: 500 },
        { id: 2, name: 'Whey Protein', stock: 300 },
        { id: 3, name: 'Fish Oil', stock: 400 }
      ]);
    }
  };

  const fetchProductions = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/productions`);
      if (response.data.success) {
        // Get the first 3 productions and map them to the required format
        const productionData = response.data.data.slice(0, 3).map(prod => ({
          id: prod.id,
          name: `Batch #${prod.id}`, // Using the production ID as batch number
          status: prod.stage // The backend uses 'stage' instead of 'status'
        }));
        setProductions(productionData);
      }
    } catch (error) {
      console.error('Error fetching productions:', error);
      // Keep the mock data as fallback
      setProductions([
        { id: 1, name: 'Vitamin C Batch #123', status: 'In Progress' },
        { id: 2, name: 'Protein Powder Batch #456', status: 'Pending' },
        { id: 3, name: 'Fish Oil Batch #789', status: 'Quality Check' }
      ]);
    }
  };

  const getDayInfo = (date) => {
    return {
      productionStatus: "2 active production batches",
      resourceAllocation: "85% resource utilization",
      qualityChecks: "3 quality checks scheduled",
      maintenance: "Routine maintenance at 15:00"
    };
  };

  // Calendar helper functions
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateString = formatDate(date);
      const todayClass = isToday(date) ? 'today' : '';

      days.push(
        <div 
          key={day} 
          className={`calendar-day ${todayClass} ${selectedDate === dateString ? 'selected' : ''}`}
          onClick={() => {
            setSelectedDate(dateString);
            setSelectedDayInfo({
              date: date,
              info: getDayInfo(date)
            });
            setIsModalOpen(true);
          }}
        >
          <span className="day-number">{day}</span>
        </div>
      );
    }

    return days;
  };

  return (
    <Layout>
      <div className="homepage">
        <div className="header">
          <h1>Production Dashboard</h1>
          <p>Welcome back, Admin</p>
        </div>

        <div className="dashboard-grid">
          {/* Quick Access Section */}
          <div className="quick-access-section">
            <h3 className="section-title">Quick Access</h3>
            <div className="quick-access-content">
              {/* New Production Button */}
              <div className="new-production-card">
                <button 
                  className="new-production-btn"
                  onClick={() => navigate('/production-queue')}
                >
                  <Plus className="icon-large" />
                  <span>New Production</span>
                  <p>Start a new production batch</p>
                </button>
              </div>

              {/* Products Card */}
              <div className="info-card">
                <div className="info-card-header">
                  <h4>Products</h4>
                  <button 
                    className="view-all-btn"
                    onClick={() => navigate('/products')}
                  >
                    View All <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="info-card-content">
                  {products.map(product => (
                    <div key={product.id} className="info-item">
                      <span className="item-name">{product.name}</span>
                      <span className="item-detail">Stock: {product.stock}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Raw Materials Card */}
              <div className="info-card">
                <div className="info-card-header">
                  <h4>Raw Materials</h4>
                  <button 
                    className="view-all-btn"
                    onClick={() => navigate('/raw-materials')}
                  >
                    View All <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="info-card-content">
                  {rawMaterials.map(material => (
                    <div key={material.id} className="info-item">
                      <span className="item-name">{material.name}</span>
                      <span className="item-detail">Stock: {material.stock}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Productions Card */}
              <div className="info-card">
                <div className="info-card-header">
                  <h4>Productions</h4>
                  <button 
                    className="view-all-btn"
                    onClick={() => navigate('/production-queue')}
                  >
                    View All <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="info-card-content">
                  {productions.map(production => (
                    <div key={production.id} className="info-item">
                      <span className="item-name">{production.name}</span>
                      <span className="item-detail">{production.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Calendar Section */}
          <div className="calendar-section">
            <div className="calendar-header">
              <h3>Production Calendar</h3>
              <div className="calendar-navigation">
                <button onClick={previousMonth}>
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span>
                  {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={nextMonth}>
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="calendar-grid">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="calendar-day-header">{day}</div>
              ))}
              {generateCalendarDays()}
            </div>
          </div>
        </div>

        <CalendarDayModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          date={selectedDayInfo?.date}
          dayInfo={selectedDayInfo?.info}
        />
      </div>
    </Layout>
  );
}

export default Homepage;