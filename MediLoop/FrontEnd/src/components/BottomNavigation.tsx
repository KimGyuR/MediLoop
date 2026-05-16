import React from 'react';
import { NavigationItem } from '../types';
import { navigationItems } from '../data/mockData';

interface BottomNavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ currentPage, onNavigate }) => {
  return (
    <div className="border-t border-gray-200 bg-white">
      <div className="flex justify-around">
        {navigationItems.map((item: NavigationItem) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.name)}
            className={`flex-1 py-3 flex flex-col items-center gap-1 ${
              currentPage === item.name
                ? 'text-primary'
                : 'text-gray-400'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BottomNavigation;
