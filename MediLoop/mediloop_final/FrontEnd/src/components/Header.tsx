import React from 'react';
import '../styles/Header.css';

const Header: React.FC = () => {
  return (
    <header className="header">
      <span className="header-logo">Mediloop</span>
      <button className="header-bell-btn" aria-label="알림">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke="#5DCAA5" strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <span className="header-bell-dot" />
      </button>
    </header>
  );
};

export default Header;