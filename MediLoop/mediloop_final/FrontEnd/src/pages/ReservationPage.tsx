import React from 'react';
import { Hospital } from '../types';
import '../styles/HospitalPage.css';

interface ReservationPageProps {
  hospital: Hospital;
  onBack: () => void;
}

const ReservationPage: React.FC<ReservationPageProps> = ({ hospital, onBack }) => {
  return (
    <>
      <div className="reservation-header">
        <p>예약 완료</p>
        <h1>{hospital.name}</h1>
      </div>
      <div className="reservation-info">
        <div className="reservation-info-text">
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="#5DCAA5" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            {hospital.address}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="#5DCAA5" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            {hospital.openingHours}
          </div>
          {hospital.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="#5DCAA5" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              {hospital.phone}
            </div>
          )}
        </div>
        <button
          className="reservation-confirm-btn"
          onClick={onBack}
        >
          확인
        </button>
      </div>
    </>
  );
};

export default ReservationPage;