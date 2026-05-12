import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);

  if (!user) return null;

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      background: 'rgba(15, 23, 42, 0.8)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      padding: '0.8rem 2rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{
            background: '#ef4444',
            color: '#fff',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '1.2rem'
          }}>+</div>
          <span style={{ 
            color: '#fff', 
            fontWeight: 800, 
            fontSize: '1.2rem', 
            letterSpacing: '1px' 
          }}>CITY CARE</span>
        </Link>

        {/* User Info & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem' }}>{user.name}</span>
            <span style={{ 
              color: '#3b82f6', 
              fontSize: '0.75rem', 
              textTransform: 'uppercase', 
              fontWeight: 700,
              letterSpacing: '0.5px'
            }}>{user.role} Dashboard</span>
          </div>

          <button 
            onClick={logout}
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              padding: '0.5rem 1.2rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
               e.target.style.background = 'rgba(239, 68, 68, 0.2)';
            }}
            onMouseOut={(e) => {
               e.target.style.background = 'rgba(239, 68, 68, 0.1)';
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
