import React, { useState } from 'react';
import { hospitals } from '../data/mockData';
import { Hospital } from '../types';

interface HospitalPageProps {
  onSelectHospital?: (hospital: Hospital) => void;
  onReserveHospital?: () => void;
}

const HospitalPage: React.FC<HospitalPageProps> = ({ onSelectHospital, onReserveHospital }) => {
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(hospitals[0]);

  const handleSelectHospital = (hospital: Hospital) => {
    setSelectedHospital(hospital);
    if (onSelectHospital) {
      onSelectHospital(hospital);
    }
  };

  const handleReserve = () => {
    if (onReserveHospital) {
      onReserveHospital();
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-primary text-white px-4 py-4 flex-shrink-0">
        <h2 className="font-semibold text-lg">병원 찾기</h2>
        <p className="text-sm opacity-90 mt-1">근처 추천 병원</p>
      </div>

      {/* Map View */}
      <div className="relative h-48 bg-gray-300 border-b border-gray-200 flex-shrink-0">
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-gray-300 to-gray-400">
          <div className="text-center">
            <div className="text-5xl mb-2">🗺️</div>
            {selectedHospital && (
              <>
                <p className="text-red-600 text-2xl font-bold">📍</p>
                <p className="text-sm text-gray-700 mt-1 font-medium">{selectedHospital.name}</p>
                <p className="text-xs text-gray-600">{selectedHospital.distance}</p>
              </>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="absolute top-3 left-4 right-4">
          <input
            type="text"
            placeholder="🔍 병원 검색"
            className="w-full px-4 py-2 rounded-lg border-0 text-sm shadow-md"
          />
        </div>
      </div>

      {/* Hospital List */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-4 pb-20">
          <div className="space-y-3">
            {hospitals.map((hospital: Hospital) => (
              <div
                key={hospital.id}
                onClick={() => handleSelectHospital(hospital)}
                className={`bg-white rounded-2xl p-4 border-2 cursor-pointer transition shadow-sm ${
                  selectedHospital?.id === hospital.id
                    ? 'border-primary shadow-md'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-base text-gray-800 mb-1">
                      {hospital.name}
                    </h3>
                    <p className="text-xs text-gray-600 mb-1">
                      📍 {hospital.address}
                    </p>
                    <p className="text-xs text-gray-600">
                      🕐 {hospital.openingHours}
                    </p>
                  </div>
                  <div className="text-right ml-2">
                    <p className="text-xs text-gray-500 mb-1 font-medium">
                      {hospital.distance}
                    </p>
                    <div className="flex items-center justify-end gap-1 bg-primary/10 px-2 py-1 rounded">
                      <span className="text-yellow-400">⭐</span>
                      <span className="text-sm font-bold text-primary">{hospital.rating}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReserve();
                    }}
                    className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-semibold"
                  >
                    예약하기
                  </button>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 border-2 border-primary text-primary py-2 rounded-lg text-sm font-semibold"
                  >
                    네비게이션
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalPage;
