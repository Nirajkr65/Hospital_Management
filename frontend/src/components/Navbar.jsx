import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        
        <Link to="/" className="navbar-logo">
          <div className="navbar-logo-icon">+</div>
          <span className="navbar-logo-text">MEDIFLOW</span>
        </Link>

        
        <div className="navbar-actions">
          <div className="navbar-user-info">
            <span className="navbar-user-name">{user.name}</span>
            <span className="navbar-user-role">{user.role} Dashboard</span>
          </div>

          <button onClick={logout} className="navbar-logout-btn">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
