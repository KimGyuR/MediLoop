import React, { useState } from 'react';
import { diagnosisResults } from '../data/mockData';
import { DiagnosisResult } from '../types';

interface DiagnosisPageProps {
  onBack: () => void;
}

const DiagnosisPage: React.FC<DiagnosisPageProps> = ({ onBack }) => {
  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-primary text-white px-4 py-4 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={onBack}
          className="text-xl font-bold"
        >
          ←
        </button>
        <h2 className="font-semibold flex-1">AI 진단 결과</h2>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-6 pb-20">
          {/* Main Result Card */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 text-center border-2 border-primary/20">
            <div className="text-6xl mb-4">
              {diagnosisResults[0].icon}
            </div>
            <h3 className="text-2xl font-bold mb-2 text-gray-800">
              {diagnosisResults[0].disease}
            </h3>
            <div className="inline-block bg-primary/10 px-4 py-2 rounded-lg mb-4">
              <p className="text-primary text-lg font-bold">
                확률: {diagnosisResults[0].probability}%
              </p>
            </div>
            <p className="text-gray-600 text-sm">
              {diagnosisResults[0].description}
            </p>
          </div>

          {/* All Results */}
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
            <h3 className="font-semibold text-base mb-4 text-gray-800">전체 진단 결과</h3>
            <div className="space-y-4">
              {diagnosisResults.map((result: DiagnosisResult, index) => (
                <div key={result.id} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{result.icon}</span>
                      <span className="font-medium text-gray-800">{result.disease}</span>
                    </div>
                    <span className="font-bold text-primary">
                      {result.probability}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-primary h-3 rounded-full"
                      style={{ width: `${result.probability}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
            <h3 className="font-semibold text-base mb-4 text-gray-800">🏥 추천 진료과</h3>
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg">
                <span className="text-2xl">🏥</span>
                <div>
                  <p className="font-medium text-sm text-gray-800">내과</p>
                  <p className="text-xs text-gray-600">기본 진료 및 진단</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg">
                <span className="text-2xl">💉</span>
                <div>
                  <p className="font-medium text-sm text-gray-800">예방접종</p>
                  <p className="text-xs text-gray-600">필요시 접종</p>
                </div>
              </div>
            </div>

            <h3 className="font-semibold text-base mb-4 text-gray-800">💊 관리 방법</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-lg">💧</span>
                <div>
                  <p className="font-medium text-sm text-gray-800">충분한 수분 섭취</p>
                  <p className="text-xs text-gray-600">하루에 2리터 이상의 물을 섭취하세요</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">😴</span>
                <div>
                  <p className="font-medium text-sm text-gray-800">충분한 휴식</p>
                  <p className="text-xs text-gray-600">8시간 이상의 숙면을 취하세요</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">🌡️</span>
                <div>
                  <p className="font-medium text-sm text-gray-800">체온 관리</p>
                  <p className="text-xs text-gray-600">따뜻한 환경에서 휴식하세요</p>
                </div>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6">
            <p className="text-xs text-red-700">
              ⚠️ <strong>중요:</strong> 증상이 심하거나 지속되면 반드시 병원을 방문하세요. 이 진단은 참고용입니다.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 fixed bottom-20 left-4 right-4 bg-white p-4 rounded-lg shadow-lg">
            <button
              onClick={onBack}
              className="flex-1 border-2 border-primary text-primary py-3 rounded-lg font-semibold"
            >
              다시 진단
            </button>
            <button className="flex-1 bg-primary text-white py-3 rounded-lg font-semibold">
              병원 찾기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosisPage;
