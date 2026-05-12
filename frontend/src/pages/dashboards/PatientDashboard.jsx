import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { AuthContext } from '../../context/AuthContext';
import '../Auth.css';

const PatientDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [queueStats, setQueueStats] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('09:00 AM');
  
  const [formMsg, setFormMsg] = useState({ text: '', type: '' });

  const timeSlots = [
    '09:00 AM', '10:00 AM', '11:00 AM', 
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'
  ];

  const formatWaitTime = (minutes) => {
    if (minutes === 0) return 'Immediate';
    if (minutes < 60) return `${minutes} mins`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const [isFetching, setIsFetching] = useState(false);
  
  const fetchData = async () => {
    if (!user?._id || isFetching) return;
    try {
      setIsFetching(true);
      // Fetch Doctors
      const docRes = await axios.get('http://localhost:5050/api/users/doctors');
      setDoctors(docRes.data);
      if (docRes.data.length > 0 && !doctorId) setDoctorId(docRes.data[0]._id);
      
      // Fetch My Appointments
      const apptRes = await axios.get(`http://localhost:5050/api/appointments/${user._id}`);
      const latestAppointments = apptRes.data;
      setAppointments(latestAppointments);
      
      // Fetch Queue Stats specifically for Waiting appointments
      const waitingAppts = latestAppointments.filter(app => app.status === 'waiting');
      const statsMap = {};
      
      if (waitingAppts.length > 0) {
        const statPromises = waitingAppts.map(appt => 
          axios.get(`http://localhost:5050/api/appointments/${appt._id}/queue-status`)
        );
        const statResponses = await Promise.all(statPromises);
        
        statResponses.forEach((res, idx) => {
          statsMap[waitingAppts[idx]._id] = res.data; 
        });
      }
      setQueueStats(statsMap);

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsFetching(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [user]);

  // Socket Live Subscription Engine
  useEffect(() => {
    const socket = io('http://localhost:5050');
    
    socket.on('queueUpdated', () => {
      console.log('Real-Time Ping: My appointments changed! Refetching active state...');
      fetchData();
    });

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line
  }, [user]);

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    setFormMsg({ text: '', type: '' });
    
    try {
      await axios.post('http://localhost:5050/api/appointments', {
        doctorId,
        date,
        timeSlot
      });
      setFormMsg({ text: 'Appointment booked successfully!', type: 'success' });
      fetchData();
    } catch (error) {
      setFormMsg({ text: error.response?.data?.message || 'Failed to book appointment', type: 'error' });
    }
  };

  return (
    <div className="dashboard-page">
      <div className="main-content">
        
        {loading && appointments.length === 0 ? (
          <p style={{ color: '#a3aed0', textAlign: 'center', padding: '5rem' }}>Loading your healthcare workspace...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', animation: 'fadeIn 0.6s ease-out' }}>
            
            {/* BOOK APPOINTMENT SECTION */}
            <div className="glass-panel" style={{ borderRadius: '24px', padding: '2.5rem' }}>
              <h3 style={{ color: '#fff', marginTop: 0, marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.8rem', fontSize: '1.4rem' }}>Book Consultation</h3>
              
              {formMsg.text && (
                <div style={{ padding: '0.8rem', background: formMsg.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: formMsg.type === 'error' ? '#f87171' : '#34d399', borderRadius: '8px', marginBottom: '1rem', border: `1px solid ${formMsg.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}` }}>
                  {formMsg.text}
                </div>
              )}

              <form onSubmit={handleBookAppointment} className="auth-form" style={{ gap: '1rem', marginTop: '1rem' }}>
                <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label>Select Doctor</label>
                    <select value={doctorId} onChange={e => setDoctorId(e.target.value)} className="role-select" required>
                      <option value="" disabled>Choose a doctor</option>
                      {doctors.map(doc => (
                        <option key={doc._id} value={doc._id}>Dr. {doc.name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label>Appointment Date</label>
                    <input 
                      type="date" 
                      value={date} 
                      onChange={e => setDate(e.target.value)} 
                      min={new Date().toLocaleDateString('en-CA')}
                      required 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Select Time Slot</label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                    {timeSlots.map(slot => (
                      <button 
                        key={slot}
                        type="button"
                        onClick={() => setTimeSlot(slot)}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '8px',
                          border: timeSlot === slot ? 'none' : '1px solid rgba(255,255,255,0.1)',
                          background: timeSlot === slot ? '#10b981' : 'rgba(15, 23, 42, 0.6)',
                          color: '#fff',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          fontWeight: timeSlot === slot ? 'bold' : 'normal'
                        }}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                <button type="submit" className="btn-primary" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)', width: 'max-content', padding: '0.8rem 2rem', marginTop: '0.5rem' }}>
                  Confirm Booking
                </button>
              </form>
            </div>

            {/* MY APPOINTMENTS SECTION */}
            <div className="glass-panel" style={{ borderRadius: '24px', padding: '2.5rem' }}>
              <h3 style={{ color: '#fff', marginTop: 0, marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.8rem', fontSize: '1.4rem' }}>Medical History</h3>
              
              {appointments.length === 0 ? (
                <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem 0' }}>No appointments scheduled yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {appointments.map(appt => {
                    const stats = queueStats[appt._id];
                    
                    return (
                      <div key={appt._id} className="appointment-item" style={{ 
                        background: 'rgba(15, 23, 42, 0.5)', 
                        padding: '1.5rem', 
                        borderRadius: '16px', 
                        border: '1px solid rgba(255,255,255,0.03)',
                        borderLeft: appt.status === 'ongoing' ? '4px solid #f43f5e' : ['done', 'skipped'].includes(appt.status) ? '4px solid #6366f1' : '4px solid #10b981',
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center'
                      }}>
                          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                            <div style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '0.8rem', borderRadius: '12px', textAlign: 'center', minWidth: '60px' }}>
                              <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.2rem' }}>Token</div>
                              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>#{appt.tokenNumber || '-'}</div>
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '1.2rem' }}>Dr. {appt.doctorId?.name}</div>
                              <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.2rem' }}>{appt.date} at {appt.timeSlot}</div>
                            </div>
                          </div>
                          <div>
                            {appt.status === 'waiting' && <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Waiting</span>}
                            {appt.status === 'ongoing' && <span style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#fb7185', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', animation: 'pulse 2s infinite' }}>Your Turn!</span>}
                            {appt.status === 'done' && <span style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Completed</span>}
                            {['cancelled', 'skipped'].includes(appt.status) && <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{appt.status}</span>}
                          </div>

                        {/* LIVE QUEUE ANALYTICS */}
                        {appt.status === 'waiting' && stats && (
                          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                              <span style={{ color: '#e2e8f0', fontWeight: 500 }}>
                                {stats.positionAhead === 0 ? 'You are Next!' : `You are #${stats.positionAhead + 1} in queue`}
                              </span>
                              <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                                Est. Wait: <strong style={{ color: '#fbbf24' }}>{formatWaitTime(stats.estimatedWaitTime)}</strong>
                              </span>
                            </div>
                            
                            <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                               <div style={{ 
                                 width: stats.positionAhead === 0 ? '100%' : `${Math.max(10, 100 - (stats.positionAhead * 20))}%`, 
                                 background: stats.positionAhead === 0 ? '#10b981' : '#3b82f6', 
                                 height: '100%', 
                                 transition: 'width 1s ease-in-out' 
                               }}></div>
                            </div>
                          </div>
                        )}
                        
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDashboard;
