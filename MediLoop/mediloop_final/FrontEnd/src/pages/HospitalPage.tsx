import React, { useState } from 'react';
import { hospitals } from '../data/mockData';
import { Hospital } from '../types';
import '../styles/HospitalPage.css';

interface HospitalPageProps {
  onReserve: (hospital: Hospital) => void;
}

interface HospitalDetailProps {
  hospital: Hospital;
  onClose: () => void;
  onReserve: (hospital: Hospital) => void;
}

const HospitalDetail: React.FC<HospitalDetailProps> = ({ hospital, onClose, onReserve }) => (
  <div className="floating-panel">
    <div className="floating-handle" />
    <div className="floating-top">
      <div>
        <div className="floating-hosp-name">{hospital.name}</div>
        <div className="floating-hosp-info">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="#5DCAA5" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          {hospital.address}
        </div>
        <div className="floating-hosp-info">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="#5DCAA5" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          {hospital.openingHours}
        </div>
        {hospital.phone && (
          <div className="floating-hosp-info">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="#5DCAA5" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            {hospital.phone}
          </div>
        )}
      </div>
      <button className="floating-close-btn" onClick={onClose}>✕</button>
    </div>
    <div className="floating-rating">
      <span style={{ fontSize: 13, color: '#f5a623' }}>⭐</span>
      <span className="floating-rating-score">{hospital.rating}</span>
      <span className="floating-rating-dist">· {hospital.distance}</span>
    </div>
    <div className="floating-btns">
      <button
        className="floating-btn-reserve"
        onClick={() => onReserve(hospital)}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        예약하기
      </button>
      <button
        className="floating-btn-nav"
        onClick={() => window.open(
          `https://map.naver.com/v5/search/${encodeURIComponent(hospital.name)}`, '_blank'
        )}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round">
          <polygon points="3 11 22 2 13 21 11 13 3 11"/>
        </svg>
        네이버지도
      </button>
    </div>
  </div>
);

const HospitalPage: React.FC<HospitalPageProps> = ({ onReserve }) => {
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [activeFilter, setActiveFilter] = useState(0);

  return (
    <div className="hospital-page">

      {/* 검색바 */}
      <div className="hospital-search-bar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="#5DCAA5" strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          className="hospital-search-input"
          placeholder="증상과 기저질환을 입력해주세요."
        />
        <button className="hospital-search-btn">검색</button>
      </div>

      {/* 퍼센테이지 바 */}
      <div className="pct-row">
        <span className="pct-label">단순 감기</span>
        <div className="pct-track">
          <div className="pct-fill" style={{ width: '85%' }} />
        </div>
        <span className="pct-value">85%</span>
        <button className="pct-info-btn">i</button>
      </div>

      {/* 지도 영역 */}
      <div className="map-area">
        <div className="map-bg">
          <span>🗺️</span>
          <span>지도 영역 (카카오맵 / 네이버맵)</span>
        </div>
        <div className="map-pin">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="#E53935" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <div className="map-pin-label">강남연세내과</div>
        </div>
        <div className="map-filter-chips">
          {['가까운순', '별점순', '리뷰순'].map((label, i) => (
            <button
              key={label}
              className={`map-chip ${activeFilter === i ? 'active' : ''}`}
              onClick={() => setActiveFilter(i)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 병원 리스트 타이틀 */}
      <div className="hosp-list-title">주변 추천 병원</div>

      {/* 병원 카드 */}
      {hospitals.map((hospital) => (
        <div
          key={hospital.id}
          className="hosp-list-card"
          onClick={() => setSelectedHospital(hospital)}
        >
          <div className="hosp-list-top">
            <span className="hosp-open-badge">영업중</span>
            <span className="hosp-list-name">{hospital.name}</span>
          </div>
          <div className="hosp-list-meta">
            {hospital.distance} · {hospital.address} · {hospital.openingHours}
          </div>
          <div className="hosp-list-btns">
            <button
              className="hosp-list-btn-reserve"
              onClick={(e) => {
                e.stopPropagation();
                onReserve(hospital);
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              예약하기
            </button>
            <button
              className="hosp-list-btn-nav"
              onClick={(e) => {
                e.stopPropagation();
                window.open(
                  `https://map.naver.com/v5/search/${encodeURIComponent(hospital.name)}`,
                  '_blank'
                );
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round">
                <polygon points="3 11 22 2 13 21 11 13 3 11"/>
              </svg>
              네이버지도
            </button>
          </div>
        </div>
      ))}

      {/* 플로팅 패널 */}
      {selectedHospital && (
        <>
          <div
            className="floating-overlay"
            onClick={() => setSelectedHospital(null)}
          />
          <HospitalDetail
            hospital={selectedHospital}
            onClose={() => setSelectedHospital(null)}
            onReserve={onReserve}
          />
        </>
      )}
    </div>
  );
};

export default HospitalPage;