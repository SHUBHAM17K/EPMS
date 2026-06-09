import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand" onClick={() => navigate('/')}>
          <span className="logo-icon">⚡</span>
          <span className="logo-text">Focus<span className="logo-accent">Flow</span></span>
        </div>
        {user && (
          <div className="navbar-menu">
            <span className="navbar-user">
              Welcome, <span className="user-name">{user.name}</span>
            </span>
            <button className="btn btn-outline" id="btn-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
