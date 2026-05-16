import React, { useState } from 'react';

interface Medicine {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  prescribedDate: string;
  doctor: string;
  hospital: string;
  taken: boolean;
}

interface MedicineManagementPageProps {
  onBack?: () => void;
}

const MedicineManagementPage: React.FC<MedicineManagementPageProps> = ({ onBack }) => {
  const [medicines, setMedicines] = useState<Medicine[]>([
    {
      id: '1',
      name: '감기약(아세트아미노펜)',
      dosage: '500mg',
      frequency: '하루 3회',
      prescribedDate: '2024-05-10',
      doctor: '김의사',
      hospital: '가천의료센터',
      taken: true,
    },
    {
      id: '2',
      name: '기침감기약',
      dosage: '표준용량',
      frequency: '하루 2회',
      prescribedDate: '2024-05-10',
      doctor: '김의사',
      hospital: '가천의료센터',
      taken: false,
    },
    {
      id: '3',
      name: '소화제',
      dosage: '1정',
      frequency: '필요시 1회',
      prescribedDate: '2024-05-08',
      doctor: '이의사',
      hospital: '삼성 의료 센터',
      taken: false,
    },
  ]);

  const toggleTaken = (id: string) => {
    setMedicines(
      medicines.map((medicine) =>
        medicine.id === id
          ? { ...medicine, taken: !medicine.taken }
          : medicine
      )
    );
  };

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
        <h2 className="font-semibold flex-1 text-lg">💊 약 관리</h2>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-6 pb-20">
          {/* Medicine List */}
          <h3 className="font-bold text-base mb-4 text-gray-800">처방약 목록</h3>
          <div className="space-y-3 mb-8">
            {medicines.map((medicine) => (
              <div
                key={medicine.id}
                className={`bg-white rounded-2xl shadow-sm p-4 border-l-4 ${
                  medicine.taken ? 'border-green-500 opacity-60' : 'border-primary'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className={`font-bold text-base mb-1 ${
                      medicine.taken ? 'text-gray-500 line-through' : 'text-gray-800'
                    }`}>
                      {medicine.name}
                    </h4>
                    <p className={`text-sm ${medicine.taken ? 'text-gray-400' : 'text-gray-600'}`}>
                      {medicine.dosage} · {medicine.frequency}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <input
                      type="checkbox"
                      checked={medicine.taken}
                      onChange={() => toggleTaken(medicine.id)}
                      className="w-6 h-6 cursor-pointer accent-primary rounded-md"
                    />
                    <span className={`text-lg font-bold ${medicine.taken ? 'text-green-500' : 'text-gray-300'}`}>
                      ✓
                    </span>
                  </div>
                </div>

                <div className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                  <p className="mb-1">{medicine.hospital} · {medicine.doctor}</p>
                  <p>처방일: {medicine.prescribedDate}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Medicine History */}
          <h3 className="font-bold text-base mb-4 text-gray-800">💊 복용 기록</h3>
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <p className="font-bold text-sm text-gray-800">감기약(아세트아미노펜)</p>
                  <p className="text-xs text-gray-500">2024-05-15 · 오후 14:00</p>
                </div>
                <span className="text-lg font-bold text-green-500">✓</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-gray-800">감기약(아세트아미노펜)</p>
                  <p className="text-xs text-gray-500">2024-05-14 · 오후 18:00</p>
                </div>
                <span className="text-lg font-bold text-green-500">✓</span>
              </div>
            </div>
          </div>

          {/* Add Medicine Button */}
          <button className="w-full bg-primary text-white py-4 rounded-lg font-bold mt-8 flex items-center justify-center gap-2">
            <span>➕</span>
            <span>약 추가하기</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MedicineManagementPage;
