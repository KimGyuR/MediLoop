import React from 'react';

const MyPagePage: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
      <div className="text-center py-12">
        <div className="text-4xl mb-4">👤</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">마이페이지</h2>
        <p className="text-gray-600">개인정보 및 진단 기록</p>
        <p className="text-gray-500 text-sm mt-4">곧 추가될 예정입니다.</p>
      </div>
    </div>
  );
};

export default MyPagePage;
