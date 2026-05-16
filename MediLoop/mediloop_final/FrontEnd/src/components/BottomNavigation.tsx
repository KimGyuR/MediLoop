import React from 'react';
import '../styles/BottomNavigation.css';

interface BottomNavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const tabs = [
  {
    id: 'home',
    label: 'Home',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#1D9E75' : '#bbb'} strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
        <path d="M9 21V12h6v9"/>
      </svg>
    ),
  },
  {
    id: 'hospital',
    label: 'Hospital',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#1D9E75' : '#bbb'} strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M12 8v8M8 12h8"/>
      </svg>
    ),
  },
  {
    id: 'medicine',
    label: 'Fill Bag',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#1D9E75' : '#bbb'} strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 3h6l1 4H8L9 3z"/>
        <rect x="4" y="7" width="16" height="14" rx="2"/>
        <path d="M12 11v6M9 14h6"/>
      </svg>
    ),
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#1D9E75' : '#bbb'} strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    ),
  },
];

const BottomNavigation: React.FC<BottomNavigationProps> = ({ currentPage, onNavigate }) => {
  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => {
        const active = currentPage === tab.id;
        return (
          <button
            key={tab.id}
            className={`bottom-nav-btn ${active ? 'active' : ''}`}
            onClick={() => onNavigate(tab.id)}
          >
            {tab.icon(active)}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNavigation;