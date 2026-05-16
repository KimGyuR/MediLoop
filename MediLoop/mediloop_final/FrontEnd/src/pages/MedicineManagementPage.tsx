import React from 'react';
import '../styles/MedicineManagementPage.css';

const MedicineManagementPage: React.FC = () => {
  return (
    <>
      <div className="medicine-card">
        <div className="medicine-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="#5DCAA5" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          생활 습관 및 주의사항
        </div>

        <div className="medicine-habit-box">
          <div className="medicine-habit-title">추천 생활습관</div>
          <div className="medicine-habit-content">
            충분한 수면, 실내 습도 50% 유지, 수분 섭취 1.5L 이상
          </div>
        </div>

        <div className="medicine-warning-box">
          <div className="medicine-warning-title">주의해야 할 음식</div>
          <div className="medicine-warning-content">
            자극적인 음식, 카페인, 음주 절대 금지
          </div>
        </div>

        <div className="medicine-critical-box">
          <div className="medicine-critical-title">CRITICAL WARNING</div>
          <div className="medicine-critical-content">
            아세트아미노펜 복용 중 음주는 간 손상의 치명적인 원인이 될 수 있습니다.
          </div>
        </div>
      </div>
    </>
  );
};

export default MedicineManagementPage;