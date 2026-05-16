import React, { useState } from 'react';
import BottomNavigation from './components/BottomNavigation';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import HospitalPage from './pages/HospitalPage';
import FitBingPage from './pages/FitBingPage';
import ProfilePage from './pages/ProfilePage';
import ReservationPage from './pages/ReservationPage';
import { Hospital } from './types';
import './index.css';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [fitBingTab, setFitBingTab] = useState<'consult' | 'medicine'>('consult');
  const [reservationHospital, setReservationHospital] = useState<Hospital | null>(null);

  const handleReserve = (hospital: Hospital) => {
    setReservationHospital(hospital);
  };

  const handleBackFromReservation = () => {
    setReservationHospital(null);
  };

  if (reservationHospital) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-200">
        <div className="phone-frame">
          <div className="phone-notch" />
          <div className="phone-screen">
            <Header />
            <main className="main-content">
              <ReservationPage
                hospital={reservationHospital}
                onBack={handleBackFromReservation}
              />
            </main>
          </div>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onReserve={handleReserve} />;
      case 'hospital':
        return <HospitalPage onReserve={handleReserve} />;
      case 'medicine':
        return <FitBingPage activeTab={fitBingTab} />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <HomePage onReserve={handleReserve} />;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-200">
      <div className="phone-frame">
        <div className="phone-notch" />
        <div className="phone-screen">
          <Header />

          {currentPage === 'medicine' && (
            <div style={{
              background: '#f5faf8',
              padding: '8px 12px',
              flexShrink: 0,
            }}>
              <div style={{
                background: '#F5FBF8',
                borderRadius: 12,
                padding: 4,
                display: 'flex',
                gap: 4,
                border: '1px solid #EAF6F1',
              }}>
                <button
                  onClick={() => setFitBingTab('consult')}
                  style={{
                    flex: 1, padding: '10px 0',
                    borderRadius: 10, fontSize: 13,
                    fontWeight: 600, border: 'none',
                    cursor: 'pointer', fontFamily: 'inherit',
                    background: fitBingTab === 'consult' ? '#5DCAA5' : 'transparent',
                    color: fitBingTab === 'consult' ? '#fff' : '#9DB8B0',
                    transition: 'all 0.2s',
                  }}
                >
                  상담 및 처방전
                </button>
                <button
                  onClick={() => setFitBingTab('medicine')}
                  style={{
                    flex: 1, padding: '10px 0',
                    borderRadius: 10, fontSize: 13,
                    fontWeight: 600, border: 'none',
                    cursor: 'pointer', fontFamily: 'inherit',
                    background: fitBingTab === 'medicine' ? '#5DCAA5' : 'transparent',
                    color: fitBingTab === 'medicine' ? '#fff' : '#9DB8B0',
                    transition: 'all 0.2s',
                  }}
                >
                  약 관리
                </button>
              </div>
            </div>
          )}

          <main className="main-content">
            {renderPage()}
          </main>

          <BottomNavigation
            currentPage={currentPage}
            onNavigate={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
}

export default App;