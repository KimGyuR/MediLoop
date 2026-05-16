import React, { useState, useRef } from 'react';
import '../styles/HomePage.css';
import DiagnosisPage from './DiagnosisPage';
import { Hospital } from '../types';

interface HomePageProps {
  onReserve: (hospital: Hospital) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onReserve }) => {
  const [symptomText, setSymptomText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleDiagnose = async () => {
    if (!symptomText.trim()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setShowResult(true);
    setLoading(false);
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  return (
    <>
      {/* 인사 + 입력 카드 */}
      <div className="home-card">
        <div className="home-greeting">
          <p>안녕하세요</p>
          <h1>오늘 어디가 불편하세요?</h1>
        </div>

        <div className="home-input-area">
          {/* 사진 업로드 */}
          <div>
            <p className="input-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="#5DCAA5" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                <circle cx="12" cy="13" r="3"/>
                <line x1="12" y1="11" x2="12" y2="9"/>
                <line x1="11" y1="10" x2="13" y2="10"/>
              </svg>
              증상 사진 첨부 (선택)
            </p>
            <button
              className="upload-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="#5DCAA5" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                <circle cx="12" cy="13" r="3"/>
                <line x1="12" y1="11" x2="12" y2="9"/>
                <line x1="11" y1="10" x2="13" y2="10"/>
              </svg>
              사진 업로드
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} />
          </div>

          {/* 텍스트 입력 */}
          <div>
            <p className="input-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="#5DCAA5" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              증상 직접 입력
            </p>
            <textarea
              className="symptom-textarea"
              rows={4}
              value={symptomText}
              onChange={(e) => setSymptomText(e.target.value)}
              placeholder={'증상과 기저질환을 자세하게 작성해주세요.\n예) 3월 전부터 두통이 심하고 속이 메스꺼워요.'}
            />
          </div>

          {/* AI 진단 버튼 */}
          <button
            className="diagnose-btn"
            onClick={handleDiagnose}
            disabled={loading || !symptomText.trim()}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="#fff" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                분석 중...
              </span>
            ) : 'AI 자가진단 시작'}
          </button>

          <p className="diagnose-disclaimer">
            본 결과는 참고용이며 정확한 진단은 의사에게 문의하세요.
          </p>
        </div>
      </div>

      {/* 분석 결과 */}
      {showResult && (
        <div ref={resultRef}>
          <DiagnosisPage
            onBack={() => setShowResult(false)}
            onReserve={onReserve}
          />
        </div>
      )}
    </>
  );
};

export default HomePage;