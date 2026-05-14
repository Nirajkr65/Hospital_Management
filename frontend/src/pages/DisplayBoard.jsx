import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import './DisplayBoard.css';

const DisplayBoard = () => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchQueue = async () => {
    try {
      const res = await axios.get('https://hospital-management-backend-1e7k.onrender.com/api/appointments/public/all');
      setQueue(res.data);
    } catch (error) {
      console.error('Failed to fetch public queue:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    const socket = io('https://hospital-management-backend-1e7k.onrender.com');
    socket.on('queueUpdated', () => {
      fetchQueue();
    });

    return () => {
      clearInterval(timer);
      socket.disconnect();
    };
  }, []);

  const ongoing = queue.filter(item => item.status === 'ongoing');
  const upcoming = queue.filter(item => item.status === 'waiting').slice(0, 10);

  return (
    <div className="display-board-container">
      {/* Header */}
      <div className="display-header">
        <div className="hospital-logo">
           <span className="plus-icon">+</span>
           <div className="logo-text">
             <h1>CITY CARE</h1>
             <p>Hospital & Medical Center</p>
           </div>
        </div>
        <div className="current-clock">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      </div>

      <div className="display-main-grid">
        {/* Left Side: Now Calling */}
        <div className="now-calling-section">
          <h2 className="section-title">Now Calling</h2>
          <div className="calling-cards-container">
            {ongoing.length === 0 ? (
              <div className="empty-state">No patients are being called right now.</div>
            ) : (
              ongoing.map(item => (
                <div key={item._id} className="calling-card ongoing-pulse">
                  <div className="token-number">#{item.tokenNumber}</div>
                  <div className="doctor-info">
                    <span className="label">Proceed to</span>
                    <span className="value">Dr. {item.doctorId?.name}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Upcoming */}
        <div className="upcoming-section">
          <h2 className="section-title">Up Next</h2>
          <div className="upcoming-list">
             {upcoming.map((item, index) => (
                <div key={item._id} className="upcoming-item">
                   <div className="upcoming-token">#{item.tokenNumber}</div>
                   <div className="upcoming-doctor">Dr. {item.doctorId?.name}</div>
                   <div className="upcoming-status">Waiting</div>
                </div>
             ))}
             {upcoming.length === 0 && !loading && (
               <div className="empty-list">Queue is clear</div>
             )}
          </div>
          
          <div className="display-footer-msg">
            Please keep your physical tokens ready. Visit reception for any assistance.
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisplayBoard;
