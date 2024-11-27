import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Homepage.css';
import axios from 'axios';
import Layout from './Layout';

function Homepage() {
  const [recentActivities, setRecentActivities] = useState([]);
  const [stats, setStats] = useState({
    activeProductions: 5,
    lowStockItems: 3,
    pendingOrders: 8
  });

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

  const formatTimeAgo = (date) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffHours = Math.floor((now - activityDate) / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    }
    return '1 day ago';
  };

  return (
    <Layout>
      <div className="homepage">
        <div className="main-content">
          <div className="left-panel">
            <div className="recent-activity">
              <h2>Recent Activity</h2>
              {recentActivities.map((activity, index) => (
                <div key={index} className="activity-item">
                  <h3>{activity.title}</h3>
                  <p className="details">
                    {activity.type}: {activity.itemName}
                  </p>
                  <p className="time">{formatTimeAgo(activity.timestamp)}</p>
                </div>
              ))}
            </div>
            
            <div className="stats-container">
              <div className="stat-card active-productions">
                <h3>Active Productions</h3>
                <span className="stat-number">{stats.activeProductions}</span>
              </div>
              <div className="stat-card low-stock">
                <h3>Low Stock Items</h3>
                <span className="stat-number">{stats.lowStockItems}</span>
              </div>
              <div className="stat-card pending-orders">
                <h3>Pending Orders</h3>
                <span className="stat-number">{stats.pendingOrders}</span>
              </div>
            </div>
          </div>

          <div className="right-panel">
            <div className="calendar-section">
              <h2>Calendar</h2>
              <div className="calendar-header">
                <h3>November 2024</h3>
              </div>
              <div className="calendar-grid">
                <div className="calendar-days">
                  <span>Sun</span>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                </div>
                <div className="calendar-dates">
                  <span className="inactive">27</span>
                  <span className="inactive">28</span>
                  <span className="inactive">29</span>
                  <span className="inactive">30</span>
                  <span className="inactive">31</span>
                  <span>1</span>
                  <span>2</span>
                </div>
              </div>

              <div className="upcoming-events">
                <h3>Upcoming Events</h3>
                <div className="event">
                  <h4>Production Deadline</h4>
                  <p>Nov 15, 2024</p>
                </div>
                <div className="event">
                  <h4>Inventory Check</h4>
                  <p>Nov 20, 2024</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Homepage;