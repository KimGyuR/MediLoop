import React, { useState } from 'react';
import BottomNavigation from './components/BottomNavigation';
import HomePage from './pages/HomePage';
import HospitalPage from './pages/HospitalPage';
import DiagnosisPage from './pages/DiagnosisPage';
import ReservationPage from './pages/ReservationPage';
import MedicineManagementPage from './pages/MedicineManagementPage';
import ProfilePage from './pages/ProfilePage';
import FitBingPage from './pages/FitBingPage';
import './index.css';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [showDiagnosis, setShowDiagnosis] = useState(false);
  const [showReservation, setShowReservation] = useState(false);

  const handleShowDiagnosis = () => {
    setShowDiagnosis(true);
  };

  const handleBackFromDiagnosis = () => {
    setShowDiagnosis(false);
  };

  const handleShowReservation = () => {
    setShowReservation(true);
  };

  const handleBackFromReservation = () => {
    setShowReservation(false);
  };

  const renderPage = () => {
    if (showDiagnosis) {
      return <DiagnosisPage onBack={handleBackFromDiagnosis} />;
    }

    if (showReservation) {
      return <ReservationPage onBack={handleBackFromReservation} />;
    }

    switch (currentPage) {
      case 'home':
        return <HomePage onShowDiagnosis={handleShowDiagnosis} />;
      case 'hospital':
        return <HospitalPage onReserveHospital={handleShowReservation} />;
      case 'medicine':
        return <MedicineManagementPage onBack={() => setCurrentPage('home')} />;
      case 'profile':
        return <ProfilePage onBack={() => setCurrentPage('home')} />;
      case 'fitching':
        return <FitBingPage />;
      default:
        return <HomePage onShowDiagnosis={handleShowDiagnosis} />;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
      <div className="phone-frame">
        <div className="phone-notch"></div>
        <div className="phone-screen">
          {renderPage()}
          {!showDiagnosis && !showReservation && (
            <BottomNavigation
              currentPage={currentPage}
              onNavigate={setCurrentPage}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
