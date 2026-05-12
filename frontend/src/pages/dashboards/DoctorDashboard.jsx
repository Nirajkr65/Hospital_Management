import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { AuthContext } from '../../context/AuthContext';
import '../Auth.css';

const DoctorDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Derived state maps
  const currentPatient = appointments.find(appt => appt.status === 'ongoing');
  const waitingQueue = appointments.filter(appt => appt.status === 'waiting');

  const [isFetching, setIsFetching] = useState(false);
 
  const fetchQueue = async () => {
    if (!user?._id || isFetching) return;
    try {
      setIsFetching(true);
      const res = await axios.get(`http://localhost:5050/api/appointments/${user._id}`);
      
      const timeToMinutes = (timeStr) => {
        const [time, period] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        return hours * 60 + minutes;
      };

      const activeQueue = res.data
        .filter(appt => !['cancelled', 'done', 'skipped'].includes(appt.status))
        .sort((a, b) => {
          // 1. Date Sort
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          
          // 2. Time Sort (using helper)
          const timeA = timeToMinutes(a.timeSlot);
          const timeB = timeToMinutes(b.timeSlot);
          if (timeA !== timeB) return timeA - timeB;

          // 3. Token Sort
          return a.tokenNumber - b.tokenNumber;
        });
        
      console.log('[DEBUG] Filtered activeQueue:', activeQueue);
      setAppointments(activeQueue);
    } catch (error) {
      console.error('Failed to fetch queue:', error);
    } finally {
      setIsFetching(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) fetchQueue();
    // eslint-disable-next-line
  }, [user]);

  // Socket Hook
  useEffect(() => {
    const socket = io('http://localhost:5050');
    
    socket.on('queueUpdated', () => {
      console.log('Real-Time Ping: Queue changed! Refetching active state...');
      if (user?._id) fetchQueue();
    });

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line
  }, [user]);

  const updateStatus = async (id, newStatus) => {
    try {
      await axios.put(`http://localhost:5050/api/appointments/${id}/status`, { status: newStatus });
      fetchQueue();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleNext = () => {
    if (waitingQueue.length > 0) {
      const nextPatientId = waitingQueue[0]._id;
      updateStatus(nextPatientId, 'ongoing');
    }
  };

  const handleDone = () => {
    if (currentPatient) {
      updateStatus(currentPatient._id, 'done');
    }
  };

  const handleSkip = (id) => {
    updateStatus(id, 'skipped');
  };

  return (
    <div className="dashboard-page">
      <div className="main-content">
        
        {/* Current Patient UI Panel */}
        <div className="glass-panel doctor-hero" style={{ 
          background: currentPatient ? 'rgba(236, 72, 153, 0.1)' : 'rgba(255, 255, 255, 0.03)', 
          border: currentPatient ? '1px solid rgba(236, 72, 153, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)', 
          borderRadius: '24px', padding: '3rem', marginBottom: '2.5rem',
          boxShadow: currentPatient ? '0 0 30px rgba(236, 72, 153, 0.15)' : 'none',
          animation: 'fadeIn 0.6s ease-out',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <h3 style={{ color: currentPatient ? '#fb7185' : '#a3aed0', marginTop: 0, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.9rem', fontWeight: 700 }}>
            {currentPatient ? 'Active Treatment' : 'Workspace Ready'}
          </h3>
          
          {loading ? (
             <p style={{ color: '#a3aed0', textAlign: 'center', padding: '2rem' }}>Loading workspace...</p>
          ) : currentPatient ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                <div style={{ background: 'rgba(236, 72, 153, 0.2)', padding: '1.5rem', borderRadius: '16px', textAlign: 'center', minWidth: '100px', animation: 'pulse 2s infinite' }}>
                  <div style={{ fontSize: '0.9rem', color: '#f472b6', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.2rem' }}>Token</div>
                  <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#fff', lineHeight: 1 }}>#{currentPatient.tokenNumber}</div>
                </div>
                
                <div>
                  <div style={{ fontWeight: 800, color: '#fff', fontSize: '2rem', marginBottom: '0.5rem' }}>{currentPatient.patientId?.name || 'Unknown Patient'}</div>
                  <div style={{ color: '#fed7aa', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#fbbf24' }}></span>
                    Scheduled for {currentPatient.date} at {currentPatient.timeSlot}
                  </div>
                </div>
              </div>

              <div className="doctor-hero-actions" style={{ display: 'flex', gap: '1rem', flexDirection: 'column', width: '200px' }}>
                <button onClick={handleDone} className="btn-primary" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)', padding: '1rem' }}>
                  Mark as Done
                </button>
                <button onClick={() => handleSkip(currentPatient._id)} className="btn-primary" style={{ background: 'rgba(255,255,255,0.05)', boxShadow: 'none', padding: '0.8rem', color: '#94a3b8' }}>
                  Skip Format
                </button>
              </div>
            </div>
          ) : (
             <div style={{ textAlign: 'center', padding: '2rem 0' }}>
               <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginBottom: '1.5rem' }}>You do not have an active patient right now.</p>
               <button 
                 onClick={handleNext} 
                 disabled={waitingQueue.length === 0}
                 className="btn-primary" 
                 style={{ 
                   background: waitingQueue.length > 0 ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : '#334155',
                   opacity: waitingQueue.length === 0 ? 0.5 : 1,
                   padding: '1rem 3rem',
                   fontSize: '1.1rem'
                 }}
               >
                 {waitingQueue.length > 0 ? `Call Next Token (#${waitingQueue[0].tokenNumber})` : 'Queue is Empty'}
               </button>
             </div>
          )}
        </div>

        {/* Up Next List Panel */}
        <div className="glass-panel" style={{ borderRadius: '24px', padding: '2.5rem' }}>
          <h3 style={{ color: '#94a3b8', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700, marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.8rem' }}>
            Waiting Queue ({waitingQueue.length})
          </h3>
          
          {!loading && waitingQueue.length === 0 && (
             <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem 0' }}>The queue is currently clear.</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {waitingQueue.map((appt, idx) => (
              <div key={appt._id} className="appointment-item" style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                background: 'rgba(255, 255, 255, 0.02)', 
                padding: '1.2rem 2rem', 
                borderRadius: '16px', 
                border: '1px solid rgba(255, 255, 255, 0.05)', 
                borderLeft: '4px solid #3b82f6',
                marginBottom: '1rem' 
              }}>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.5rem', color: '#60a5fa', minWidth: '45px' }}>#{appt.tokenNumber}</div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '1.1rem' }}>{appt.patientId?.name || 'Anonymous'}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Scheduled: {appt.date} at {appt.timeSlot}</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  {idx === 0 && !currentPatient && (
                    <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>Next in Line</span>
                  )}
                  <button 
                    onClick={() => handleSkip(appt._id)} 
                    style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '0.4rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                  >
                    Skip
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <style dangerouslySetInnerHTML={{__html: `
          @keyframes pulse {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(0.98); }
            100% { opacity: 1; transform: scale(1); }
          }
        `}} />
      </div>
    </div>
  );
};

export default DoctorDashboard;
