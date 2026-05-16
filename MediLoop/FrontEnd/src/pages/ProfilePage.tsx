import React, { useState } from 'react';

interface ProfilePageProps {
  onBack?: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onBack }) => {
  const [userInfo] = useState({
    name: '홍길동',
    phone: '010-1234-5678',
    email: 'user@example.com',
    birthDate: '1990-05-15',
    bloodType: 'O+',
  });

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Header with Profile */}
      <div className="bg-primary text-white px-4 py-6 flex-shrink-0">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-1">{userInfo.name}</h2>
            <p className="text-primary-100 text-sm">{userInfo.phone}</p>
          </div>
          <button className="text-2xl">⚙️</button>
        </div>
        <button className="w-full bg-primary-700 text-white py-2 rounded-lg font-medium text-sm">
          📝 프로필 수정
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-6 pb-20">
          {/* Health Status */}
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
            <h3 className="font-semibold text-base mb-4 text-gray-800">💚 건강 정보</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <span className="text-gray-700 text-sm">혈액형</span>
                <span className="font-semibold text-primary">{userInfo.bloodType}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <span className="text-gray-700 text-sm">알레르기</span>
                <span className="text-primary text-sm font-medium cursor-pointer">➕ 등록</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 text-sm">만성질환</span>
                <span className="text-primary text-sm font-medium cursor-pointer">➕ 등록</span>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
            <h3 className="font-semibold text-base mb-4 text-gray-800">📋 개인정보</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <span className="text-gray-700 text-sm">이메일</span>
                <span className="text-gray-600 text-sm">{userInfo.email}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <span className="text-gray-700 text-sm">생년월일</span>
                <span className="text-gray-600 text-sm">{userInfo.birthDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 text-sm">전화번호</span>
                <span className="text-gray-600 text-sm">{userInfo.phone}</span>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
            <h3 className="font-semibold text-base mb-4 text-gray-800">⚙️ 설정</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 text-sm">알림 받기</span>
                <div className="relative inline-flex w-10 h-6 bg-primary rounded-full cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="absolute opacity-0 w-full h-full cursor-pointer"
                  />
                  <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition"></div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-gray-700 text-sm">위치 정보 사용</span>
                <div className="relative inline-flex w-10 h-6 bg-primary rounded-full cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="absolute opacity-0 w-full h-full cursor-pointer"
                  />
                  <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Support */}
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
            <h3 className="font-semibold text-base mb-4 text-gray-800">❓ 도움 및 지원</h3>
            
            <div className="space-y-2">
              <button className="w-full text-left py-3 text-gray-700 text-sm flex items-center justify-between border-b border-gray-100">
                <span>📢 공지사항</span>
                <span className="text-gray-400">›</span>
              </button>
              <button className="w-full text-left py-3 text-gray-700 text-sm flex items-center justify-between border-b border-gray-100">
                <span>❓ 자주 묻는 질문</span>
                <span className="text-gray-400">›</span>
              </button>
              <button className="w-full text-left py-3 text-gray-700 text-sm flex items-center justify-between border-b border-gray-100">
                <span>📄 개인정보 처리방침</span>
                <span className="text-gray-400">›</span>
              </button>
              <button className="w-full text-left py-3 text-gray-700 text-sm flex items-center justify-between">
                <span>📋 이용약관</span>
                <span className="text-gray-400">›</span>
              </button>
            </div>
          </div>

          {/* Logout & Delete */}
          <button className="w-full border-2 border-primary text-primary py-3 rounded-lg font-semibold mb-2">
            로그아웃
          </button>
          <button className="w-full text-red-500 py-2 text-sm font-medium">
            계정 삭제
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
