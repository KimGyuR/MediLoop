import React from 'react';

const FitBingPage: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-primary text-white px-4 py-4 flex-shrink-0">
        <h2 className="font-semibold text-lg">💪 Fit-Bing</h2>
        <p className="text-sm opacity-90 mt-1">건강 관리 및 운동 정보</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">💪</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Fit-Bing</h3>
          <p className="text-gray-600 text-sm mb-4">건강한 생활을 위한 운동 정보</p>
          <div className="bg-primary/10 border-2 border-primary/30 rounded-lg px-6 py-3 mt-4 inline-block">
            <p className="text-sm text-primary font-medium">🚀 곧 오픈 예정입니다!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FitBingPage;
