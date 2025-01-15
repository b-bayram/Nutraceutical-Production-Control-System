import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/notifications`);
      setNotifications(response.data.data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Her 30 saniyede bir bildirimleri güncelle
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`${API_URL}/api/notifications/${notificationId}/read`);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (loading) {
    return (
      <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-lg p-4">
        <p className="text-gray-500">Loading notifications...</p>
      </div>
    );
  }

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-lg">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">Notifications</h3>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 border-b hover:bg-gray-50 ${
              notification.priority === 'high' ? 'bg-red-50' : ''
            } ${notification.read ? 'opacity-50' : ''}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">{notification.title}</h4>
                <p className="text-sm text-gray-600">{notification.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </div>
              {!notification.read && (
                <button
                  onClick={() => markAsRead(notification.id)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Mark as read
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notifications; 