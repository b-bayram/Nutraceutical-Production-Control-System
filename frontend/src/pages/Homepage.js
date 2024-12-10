import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, Box, Clock, TrendingUp, BarChart2, ChevronLeft, ChevronRight } from 'lucide-react';
import Layout from './Layout';
import axios from 'axios';
import './Homepage.css';
import CalendarDayModal from '../components/calendar/CalendarDayModal';


function Homepage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDayInfo, setSelectedDayInfo] = useState(null);

  const getDayInfo = (date) => {
    // Burada normalde API'den o güne ait bilgileri çekeceksiniz
    return {
      productionStatus: "2 active production batches",
      resourceAllocation: "85% resource utilization",
      qualityChecks: "3 quality checks scheduled",
      maintenance: "Routine maintenance at 15:00"
    };
  };

  // Sample production data
  const productionData = [
    { month: 'Jan', planned: 100, actual: 85, efficiency: 85 },
    { month: 'Feb', planned: 100, actual: 90, efficiency: 90 },
    { month: 'Mar', planned: 100, actual: 95, efficiency: 95 },
    { month: 'Apr', planned: 100, actual: 88, efficiency: 88 },
    { month: 'May', planned: 100, actual: 92, efficiency: 92 }
  ];

  useEffect(() => {
    fetchRecentActivities();
  }, []);

  const fetchRecentActivities = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/activities');
      setRecentActivities(response.data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
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
        {/* Header Section */}
        <div className="header">
          <h1>Production Dashboard</h1>
          <p>Welcome back, Admin</p>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-info">
                <p>Active Productions</p>
                <h3>12</h3>
                <span className="trend positive">+2.5% from yesterday</span>
              </div>
              <div className="icon-container blue">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-info">
                <p>Production Efficiency</p>
                <h3>92%</h3>
                <span className="trend positive">+1.2% from last week</span>
              </div>
              <div className="icon-container green">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-info">
                <p>Material Alerts</p>
                <h3>3</h3>
                <span className="trend negative">2 critical items</span>
              </div>
              <div className="icon-container red">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-info">
                <p>Completed Today</p>
                <h3>8</h3>
                <span className="trend positive">85% of daily target</span>
              </div>
              <div className="icon-container purple">
                <BarChart2 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="main-grid">
          {/* Chart Card */}
          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">Production Overview</h3>
              <div className="tab-buttons">
                <button 
                  className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  Overview
                </button>
                <button 
                  className={`tab-button ${activeTab === 'efficiency' ? 'active' : ''}`}
                  onClick={() => setActiveTab('efficiency')}
                >
                  Efficiency
                </button>
              </div>
            </div>
            <div className="chart-content">
              {activeTab === 'overview' ? (
                <div className="flex justify-around items-end h-64 mt-4">
                  {productionData.map((data, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div className="w-16 bg-blue-500 rounded-t" 
                           style={{height: `${data.actual}px`}}></div>
                      <span className="text-sm mt-2">{data.month}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex justify-around items-end h-64 mt-4">
                  {productionData.map((data, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div className="w-16 bg-green-500 rounded-t" 
                           style={{height: `${data.efficiency}px`}}></div>
                      <span className="text-sm mt-2">{data.month}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Calendar Card */}
          <div className="calendar-card">
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

        {/* Activity Section */}
        <div className="activity-section">
          <div className="activity-card">
            <h3 className="section-title">Recent Activity</h3>
            <div className="activity-list">
              {recentActivities.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-icon">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="activity-content">
                    <p className="activity-title">{activity.title}</p>
                    <p className="activity-details">{activity.type}: {activity.itemName}</p>
                  </div>
                  <span className="activity-time">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="quick-actions">
            <h3 className="section-title">Quick Actions</h3>
            <div className="quick-actions-grid">
              <button className="quick-action-btn bg-blue-50">
                <Box className="quick-action-icon text-blue-600" />
                <span>New Production</span>
              </button>
              <button className="quick-action-btn bg-green-50">
                <Activity className="quick-action-icon text-green-600" />
                <span>View Reports</span>
              </button>
              <button className="quick-action-btn bg-purple-50">
                <TrendingUp className="quick-action-icon text-purple-600" />
                <span>Analytics</span>
              </button>
              <button className="quick-action-btn bg-orange-50">
                <AlertTriangle className="quick-action-icon text-orange-600" />
                <span>Alerts</span>
              </button>
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