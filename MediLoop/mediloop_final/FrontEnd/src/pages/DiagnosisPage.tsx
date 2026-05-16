import React from 'react';
import { diagnosisResults, hospitals } from '../data/mockData';
import { Hospital } from '../types';
import '../styles/HomePage.css';

interface DiagnosisPageProps {
  onBack: () => void;
  onReserve: (hospital: Hospital) => void;
}

const DiagnosisPage: React.FC<DiagnosisPageProps> = ({ onBack, onReserve }) => {
  return (
    <div className="result-area">
      {/* 결과 카드 */}
      <div className="result-card">
        <div className="result-header">
          <span className="result-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="#5DCAA5" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            분석 결과 요약
          </span>
          <span className="result-badge">AI 진단 추정</span>
        </div>

        <div className="result-top-disease">
          <div>
            <div className="disease-name">{diagnosisResults[0].disease}</div>
            <div className="disease-sub">가장 높은 일치율</div>
          </div>
          <div className="disease-circle">
            {diagnosisResults[0].probability}%
          </div>
        </div>

        <div className="bar-list">
          {diagnosisResults.map((r) => (
            <div key={r.id}>
              <div className="bar-labels">
                <span>{r.disease}</span>
                <span>{r.probability}%</span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${r.probability}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="advice-box">
          충분한 휴식과 수분 섭취가 권장됩니다. 발열이 지속될 경우 내원을 추천합니다.
        </div>
      </div>

      {/* 주변 병원 추천 */}
      <div className="hosp-section-title">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="#5DCAA5" strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        주변 병원 추천
      </div>

      {hospitals.map((h, i) => (
        <div
          key={h.id}
          className={`hosp-card ${i === 1 ? 'emergency' : ''}`}
        >
          <span className={`hosp-badge ${i === 1 ? 'emergency' : ''}`}>
            {i === 1 ? '응급 병원' : '최우선 일반 병원'}
          </span>
          <div className="hosp-name">{h.name}</div>
          <div className="hosp-addr">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="#aaa" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            {h.address} · {h.distance}
          </div>
          <div className="hosp-btns">
            <button
              className={`hosp-btn-reserve ${i === 1 ? 'emergency' : ''}`}
              onClick={() => onReserve(h)}
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
              className={`hosp-btn-nav ${i === 1 ? 'emergency' : ''}`}
              onClick={() => window.open(
                `https://map.naver.com/v5/search/${encodeURIComponent(h.name)}`, '_blank'
              )}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round">
                <polygon points="3 11 22 2 13 21 11 13 3 11"/>
              </svg>
              길찾기
            </button>
          </div>
        </div>
      ))}

      <p className="result-disclaimer">
        AI 분석은 참고용이며 의학적 진단이 아닙니다.
      </p>
    </div>
  );
};

export default DiagnosisPage;