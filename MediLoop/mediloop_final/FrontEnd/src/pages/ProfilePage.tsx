import React, { useState } from 'react';
import '../styles/ProfilePage.css';

const ProfilePage: React.FC = () => {
  const [showAllSymptoms, setShowAllSymptoms] = useState(false);

  const symptoms = [
    { date: '오늘', name: '두통 및 발열' },
    { date: '05.20', name: '소화 불량' },
    { date: '05.15', name: '심한 근육통' },
    { date: '05.10', name: '기침 및 콧물' },
    { date: '05.05', name: '복통' },
  ];

  const visibleSymptoms = showAllSymptoms ? symptoms : symptoms.slice(0, 3);

  return (
    <>
      {/* 프로필 카드 */}
      <div style={{
        borderRadius: 20,
        border: '0.5px solid #e8f5f0',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* 위 - 초록 */}
        <div style={{ background: '#5DCAA5', padding: '16px 16px 20px',borderRadius: '20px 20px 0 0',}}>
          <div className="profile-user-row">
            <div className="profile-user-left">
              <div className="profile-avatar">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke="rgba(255,255,255,0.8)" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div>
                <div className="profile-name">김철수 님</div>
                <div className="profile-days">425일째 관리 중</div>
              </div>
            </div>
            <span className="profile-type-badge">A형 / 만 32세</span>
          </div>
        </div>

        {/* 아래 - 흰색 */}
        <div style={{ background: '#fff', padding: '14px 16px', borderRadius: '0 0 20px 20px',}}>
          <div className="profile-info-row">
            <div style={{ flex: 1, background: '#f5faf8', borderRadius: 12, padding: '10px 12px', border: '0.5px solid #e8f5f0', }}>
              <div className="profile-info-label">기저 질환</div>
              <div className="profile-info-value">고혈압(초기)</div>
            </div>
            <div style={{ width: '0.5px', background: '#e8f5f0', margin: '0 12px' }} />
            <div style={{ flex: 1, background: '#f5faf8', borderRadius: 12, padding: '10px 12px', border: '0.5px solid #e8f5f0', }}>
              <div className="profile-info-label">알레르기</div>
              <div className="profile-info-value">비염, 감각류</div>
            </div>
          </div>
        </div>
      </div>

      {/* 생활 습관 및 주의사항 */}
      <div className="profile-habit-card">
        <div className="profile-section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="#5DCAA5" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          생활 습관 및 주의사항
        </div>
        <div className="profile-habit-green">
          <div className="profile-habit-green-title">추천 생활습관</div>
          <div className="profile-habit-green-content">
            충분한 수면, 실내 습도 50% 유지, 수분 섭취 1.5L 이상
          </div>
        </div>
        <div className="profile-habit-red">
          <div className="profile-habit-red-title">주의해야 할 음식</div>
          <div className="profile-habit-red-content">
            자극적인 음식, 카페인, 음주 절대 금지
          </div>
        </div>
        <div className="profile-critical-box">
          <div className="profile-critical-title">CRITICAL WARNING</div>
          <div className="profile-critical-content">
            아세트아미노펜 복용 중 음주는 간 손상의 치명적인 원인이 될 수 있습니다.
          </div>
        </div>
      </div>

      {/* 지난 증상 기록 */}
      <div className="profile-card">
        <div className="profile-card-header">
          <div className="profile-card-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="#5DCAA5" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            지난 증상 기록
          </div>
          <button
            className="profile-view-all-btn"
            onClick={() => setShowAllSymptoms(!showAllSymptoms)}
          >
            {showAllSymptoms ? '접기' : '전체보기'}
          </button>
        </div>
        {visibleSymptoms.map((s, i) => (
          <div key={i} className="symptom-item">
            <div>
              <div className="symptom-date">{s.date}</div>
              <div className="symptom-name">{s.name}</div>
            </div>
            <span className="symptom-arrow">›</span>
          </div>
        ))}
      </div>

      {/* 최근 병원 예약 */}
      <div className="profile-card">
        <div className="profile-card-header">
          <div className="profile-card-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="#5DCAA5" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            최근 병원 예약
          </div>
        </div>
        <div className="reservation-item">
          <div className="reservation-item-left">
            <span className="reservation-d-badge">D-3</span>
            <div className="reservation-hosp-name">서울대학교병원 (내과)</div>
            <div className="reservation-date">2026.05.28(목) 오전 10:30</div>
          </div>
          <span className="settings-arrow">›</span>
        </div>
        <div className="reservation-item">
          <div className="reservation-item-left">
            <span className="reservation-done-badge">진료 완료</span>
            <div className="reservation-hosp-name">연세바른정형외과</div>
            <div className="reservation-date">2026.04.30(목)</div>
          </div>
          <span className="settings-arrow">›</span>
        </div>
      </div>

      {/* 설정 및 계정 관리 */}
      <div className="settings-card">
        <div className="settings-item">
          <div className="settings-item-left">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="#555" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            <span className="settings-item-label">설정 및 계정 관리</span>
          </div>
          <span className="settings-arrow">›</span>
        </div>
        <div className="settings-item">
          <div className="settings-item-left">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="#E53935" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span className="settings-item-label danger">로그아웃</span>
          </div>
          <span className="settings-arrow">›</span>
        </div>
      </div>

      <div style={{ height: 8 }} />
    </>
  );
};

export default ProfilePage;