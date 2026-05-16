import React, { useState } from 'react';

interface Reservation {
  id: string;
  hospitalName: string;
  date: string;
  time: string;
  department: string;
  doctor: string;
  status: 'confirmed' | 'pending' | 'completed';
}

interface ReservationPageProps {
  onBack?: () => void;
}

const ReservationPage: React.FC<ReservationPageProps> = ({ onBack }) => {
  const [reservations] = useState<Reservation[]>([
    {
      id: '1',
      hospitalName: '가천의료센터',
      date: '2024-05-20',
      time: '14:00',
      department: '내과',
      doctor: '김의사',
      status: 'confirmed',
    },
    {
      id: '2',
      hospitalName: '삼성 의료 센터',
      date: '2024-05-25',
      time: '10:00',
      department: '외과',
      doctor: '이의사',
      status: 'pending',
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'completed':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '✓ 예약확정';
      case 'pending':
        return '⏳ 대기중';
      case 'completed':
        return '✓ 완료';
      default:
        return '';
    }
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
        <h2 className="font-semibold flex-1 text-lg">진료 예약</h2>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-6 pb-20">
          {/* Upcoming Reservations */}
          <h3 className="font-bold text-base mb-4 text-gray-800">📅 예정된 진료</h3>
          <div className="space-y-3 mb-8">
            {reservations.map((reservation) => (
              <div
                key={reservation.id}
                className="bg-white rounded-2xl shadow-sm p-4 border-l-4 border-primary"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-base text-gray-800 mb-1">
                      {reservation.hospitalName}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {reservation.department} · {reservation.doctor}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getStatusColor(reservation.status)}`}>
                    {getStatusLabel(reservation.status)}
                  </span>
                </div>

                <div className="bg-primary/5 rounded-lg p-3 mb-3 flex gap-4">
                  <div>
                    <p className="text-xs text-gray-600 font-medium mb-1">진료 예정일</p>
                    <p className="font-bold text-gray-800">{reservation.date}</p>
                  </div>
                  <div className="w-px bg-gray-300"></div>
                  <div>
                    <p className="text-xs text-gray-600 font-medium mb-1">진료 시간</p>
                    <p className="font-bold text-gray-800">{reservation.time}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-semibold">
                    수정
                  </button>
                  <button className="flex-1 border-2 border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-semibold">
                    취소
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Past Appointments */}
          <h3 className="font-bold text-base mb-4 text-gray-800">✓ 진료 완료</h3>
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center text-gray-500 border-2 border-dashed border-gray-200">
            <p className="text-3xl mb-2">📋</p>
            <p className="text-sm">진료 기록이 없습니다.</p>
          </div>

          {/* New Reservation Button */}
          <button className="w-full bg-primary text-white py-4 rounded-lg font-bold mt-8 flex items-center justify-center gap-2">
            <span>➕</span>
            <span>새로운 진료 예약</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReservationPage;
