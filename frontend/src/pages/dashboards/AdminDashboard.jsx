import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { AuthContext } from '../../context/AuthContext';
import '../Auth.css';

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5050/api/admin/stats');
      setStats(res.data);
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="dashboard-page">
      <div className="main-content">
        
        {loading ? (
          <p style={{ color: '#a3aed0', textAlign: 'center', padding: '5rem' }}>Gathering hospital insights...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', animation: 'fadeIn 0.6s ease-out' }}>
            
            {/* Header / Actions Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
               <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Analytics Overview</h2>
               <button onClick={fetchStats} className="btn-primary" style={{ marginTop: 0, padding: '0.6rem 1.5rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', boxShadow: 'none', fontSize: '0.9rem' }}>Refresh Live Data</button>
            </div>

            {/* Stat Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              <div className="stat-card">
                <span className="stat-label">Total Patients</span>
                <span className="stat-value">{stats?.totalPatients || 0}</span>
                <span className="stat-delta">Scheduled Today</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Avg. Wait Time</span>
                <span className="stat-value">{stats?.avgWaitTime || 0}m</span>
                <span className="stat-delta">Facility Average</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Active Doctors</span>
                <span className="stat-value">{stats?.activeDoctors || 0}</span>
                <span className="stat-delta">On-Duty Status</span>
              </div>
            </div>

            {/* Charts Row */}
            <div className="admin-charts-grid" style={{ display: 'grid', gap: '2rem', marginTop: '1rem' }}>
              
              {/* Doctor Performance Bar Chart */}
              <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '16px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ color: '#fff', marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 600 }}>Doctor Performance (Patients Treated)</h3>
                <div style={{ width: '100%', height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.performanceData || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ color: '#3b82f6' }}
                      />
                      <Bar dataKey="done" name="Completed" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                      <Bar dataKey="total" name="Total Bookings" fill="rgba(59, 130, 246, 0.1)" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Status Distribution Pie Chart */}
              <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '16px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ color: '#fff', marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 600 }}>Queue Distribution</h3>
                <div style={{ width: '100%', height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats?.statusStats || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stats?.statusStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                      />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

          </div>
        )}

        <style dangerouslySetInnerHTML={{__html: `
          .stat-card {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.08);
            padding: 1.5rem;
            border-radius: 16px;
            display: flex;
            flex-direction: column;
            transition: transform 0.2s ease;
          }
          .stat-card:hover {
            transform: translateY(-5px);
            background: rgba(255, 255, 255, 0.05);
          }
          .stat-label {
            color: #94a3b8;
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 0.5rem;
          }
          .stat-value {
            color: #fff;
            font-size: 2.5rem;
            font-weight: 800;
            line-height: 1.2;
          }
          .stat-delta {
            color: #3b82f6;
            font-size: 0.8rem;
            margin-top: 0.5rem;
            font-weight: 600;
          }
          .admin-charts-grid {
            grid-template-columns: 1.6fr 1fr;
          }
          @media (max-width: 992px) {
            .admin-charts-grid {
              grid-template-columns: 1fr;
            }
          }
        `}} />
      </div>
    </div>
  );
};

export default AdminDashboard;
