import React, { useState } from 'react';
import { symptoms, diagnosisResults } from '../data/mockData';
import { Symptom } from '../types';

interface HomePageProps {
  onShowDiagnosis: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onShowDiagnosis }) => {
  const [selectedSymptom, setSelectedSymptom] = useState<string>('');
  const [showDiagnosis, setShowDiagnosis] = useState(false);

  const handleStartDiagnosis = () => {
    setShowDiagnosis(true);
    setTimeout(onShowDiagnosis, 300);
  };

  if (showDiagnosis) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-primary text-white px-4 py-6 flex-shrink-0">
        <p className="text-sm font-medium opacity-90 mb-1">안녕하세요</p>
        <h1 className="text-2xl font-bold">어디가 불편해요?</h1>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-6">
          {/* Search Input */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex items-center gap-3 text-gray-400">
              <span className="text-lg">🔍</span>
              <input
                type="text"
                placeholder="증상을 검색하세요"
                className="flex-1 outline-none text-sm placeholder-gray-400 bg-white"
              />
            </div>
          </div>

          {/* Symptoms Grid */}
          <div className="mb-6">
            <h3 className="font-semibold text-base mb-4 text-gray-800">주요 증상</h3>
            <div className="grid grid-cols-2 gap-3">
              {symptoms.slice(0, 6).map((symptom: Symptom) => (
                <button
                  key={symptom.id}
                  onClick={() => setSelectedSymptom(symptom.id)}
                  className={`p-4 rounded-lg border-2 transition font-medium text-sm ${
                    selectedSymptom === symptom.id
                      ? 'border-primary bg-primary text-white'
                      : 'border-primary/20 bg-primary/5 text-gray-700'
                  }`}
                >
                  <div className="text-2xl mb-2">{symptom.icon}</div>
                  <div>{symptom.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* AI Diagnosis Button */}
          <button
            onClick={handleStartDiagnosis}
            className="w-full bg-primary text-white py-4 rounded-lg font-semibold mb-6 flex items-center justify-center gap-2"
          >
            <span>🤖</span>
            <span>AI 자가진단 시작</span>
          </button>

          {/* Results Preview */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-base">최근 진단 결과</h3>
              <span className="text-xs text-primary bg-primary/10 px-3 py-1 rounded-full font-medium">
                ✓ 완료
              </span>
            </div>

            <div className="space-y-4">
              {diagnosisResults.map((result, index) => (
                <div key={result.id} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{result.icon}</span>
                      <span className="text-sm font-medium text-gray-800">{result.disease}</span>
                    </div>
                    <span className="text-sm font-bold text-primary">
                      {result.probability}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${result.probability}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-primary/5 rounded-lg text-xs text-gray-600 border border-primary/10">
              💡 이 결과는 참고용이며, 정확한 진단은 의사 상담이 필요합니다.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
