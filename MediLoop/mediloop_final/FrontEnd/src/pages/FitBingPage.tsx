import React, { useState, useRef } from 'react';
import MedicineManagementPage from './MedicineManagementPage';
import '../styles/FitBingPage.css';

interface FitBingPageProps {
  activeTab: 'consult' | 'medicine';
}

const FitBingPage: React.FC<FitBingPageProps> = ({ activeTab }) => {
  const [doctorNote, setDoctorNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [dosage, setDosage] = useState<'3' | '2' | 'custom'>('3');
  const [alarms, setAlarms] = useState({
    feedback: true,
    sideEffect: true,
    hospital: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleDiagnose = async () => {
    if (!doctorNote.trim()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setShowResult(true);
    setLoading(false);
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const toggleAlarm = (key: keyof typeof alarms) => {
    setAlarms((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (activeTab === 'medicine') {
    return <MedicineManagementPage />;
  }

  return (
    <>
      {/* 사후 관리 카드 */}
      <div className="fitbing-card">
        <div className="fitbing-header">
          <p>사후 관리</p>
          <h2>진료 후 관리를 시작해요</h2>
        </div>

        <div className="fitbing-input-area">
          {/* 처방전 사진 업로드 */}
          <div>
            <p className="fitbing-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="#5DCAA5" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                <circle cx="12" cy="13" r="3"/>
                <line x1="12" y1="11" x2="12" y2="9"/>
                <line x1="11" y1="10" x2="13" y2="10"/>
              </svg>
              처방전 사진 업로드
            </p>
            <button
              className="fitbing-upload-btn"
              onClick={() => fileInputRef.current?.click()}
            >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="#5DCAA5" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
              <circle cx="12" cy="13" r="3"/>
              <line x1="19" y1="17" x2="19" y2="21" stroke="#5DCAA5" strokeWidth="2"/>
              <line x1="17" y1="19" x2="21" y2="19" stroke="#5DCAA5" strokeWidth="2"/>
            </svg>
            사진 업로드
          </button> 

          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} />
          </div>

          {/* 의사 소견 입력 */}
          <div>
            <p className="fitbing-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="#5DCAA5" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              의사 소견 입력
            </p>
            <textarea
              className="fitbing-textarea"
              rows={4}
              value={doctorNote}
              onChange={(e) => setDoctorNote(e.target.value)}
              placeholder="병명과 의사의 소견을 작성해주세요."
            />
          </div>

          {/* AI 자가진단 버튼 */}
          <button
            className="fitbing-diagnose-btn"
            onClick={handleDiagnose}
            disabled={loading || !doctorNote.trim()}
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

          <p className="fitbing-disclaimer">
            본 결과는 참고용이며 정확한 진단은 의사에게 문의하세요.
          </p>
        </div>
      </div>

      {/* AI 분석 결과 */}
      {showResult && (
        <div ref={resultRef} className="fitbing-result-area">

          {/* AI 분석 요약 */}
          <div className="fitbing-result-card">
            <div className="fitbing-result-header">
              <span className="fitbing-result-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="#5DCAA5" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
                  <path d="M20 3v4M22 5h-4"/>
                </svg>
                AI 분석 요약
              </span>
              <span className="fitbing-result-badge">참고용</span>
            </div>
            <div className="fitbing-disease-row">
              <div>
                <div className="fitbing-disease-name">급성 상기도 감염</div>
                <div className="fitbing-disease-sub">가장 높은 일치율</div>
              </div>
              <div className="fitbing-circle">87%</div>
            </div>
            <div className="fitbing-advice">
              최근 3개월간 호흡기 관련 증상이 15% 감소했습니다. 현재 상태는 매우 안정적입니다.
            </div>
            <p className="fitbing-legal">
              본 정보는 참고용이며 정확한 진단은 전문의와 상담하세요. (의료법 제27조 준수)
            </p>
          </div>

          {/* 복약 알림 설정 */}
          <div className="alarm-card">
            <div>
              <div className="alarm-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="#5DCAA5" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                복약 알림 설정
              </div>
              <div className="alarm-subtitle">약 복용 주기 설정</div>
            </div>

            <div className="dosage-btns">
              {(['3', '2', 'custom'] as const).map((d) => (
                <button
                  key={d}
                  className={`dosage-btn ${dosage === d ? 'active' : ''}`}
                  onClick={() => setDosage(d)}
                >
                  {d === '3' ? '1일 3회' : d === '2' ? '1일 2회' : '수기 입력'}
                </button>
              ))}
            </div>

            <div>
              <div className="push-label">푸시 알림 설정</div>
              {[
                { key: 'feedback' as const, title: '피드백 루프 푸시 알림', sub: '열 내렸나요? 발진 생겼나요?' },
                { key: 'sideEffect' as const, title: '부작용 감지 푸시 알림', sub: '이상 증상 감지 시 알림 (참고용)' },
                { key: 'hospital' as const, title: '병원 재방문 추천 알림', sub: '증상 지속 시 병원 재방문 안내' },
              ].map((item) => (
                <div key={item.key} className="alarm-item">
                  <div>
                    <div className="alarm-item-title">{item.title}</div>
                    <div className="alarm-item-sub">{item.sub}</div>
                  </div>
                  <div
                    className={`toggle ${alarms[item.key] ? 'on' : ''}`}
                    onClick={() => toggleAlarm(item.key)}
                  >
                    <div className="toggle-thumb" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 가까운 일반 병원 */}
          <div className="nearby-card">
            <div className="nearby-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="#5DCAA5" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              가까운 일반 병원
            </div>
            <div className="nearby-hosp-box">
              <div className="nearby-hosp-top">
                <span className="nearby-open-badge">영업중</span>
                <span className="nearby-hosp-name">서울 연세 이비인후과</span>
              </div>
              <div className="nearby-hosp-meta">450m · 강남구 · 09:00 ~ 18:00</div>
              <div className="nearby-btns">
                <button className="nearby-btn-reserve">
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
                  className="nearby-btn-nav"
                  onClick={() => window.open('https://map.naver.com/v5/search/서울연세이비인후과', '_blank')}
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
            <button className="more-hosp-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M12 8v8M8 12h8"/>
              </svg>
              주변 병원 더보기
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FitBingPage;