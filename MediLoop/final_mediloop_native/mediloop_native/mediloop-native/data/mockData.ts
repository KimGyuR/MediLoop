import { DiagnosisResult, Hospital, NavigationItem, Symptom } from "../types";

export const symptoms: Symptom[] = [
  { id: "1", name: "감기", icon: "🤧" },
  { id: "2", name: "두통", icon: "🤕" },
  { id: "3", name: "소화불량", icon: "🤢" },
  { id: "4", name: "기침", icon: "😷" },
  { id: "5", name: "복통", icon: "😫" },
  { id: "6", name: "인후염", icon: "😦" },
  { id: "7", name: "피로", icon: "😴" },
  { id: "8", name: "발진", icon: "🔴" },
];

export const diagnosisResults: DiagnosisResult[] = [
  {
    id: "1",
    disease: "단순 감기",
    probability: 58,
    icon: "🤧",
    description: "일반적인 감기 증상으로 보입니다.",
  },
  {
    id: "2",
    disease: "역류성 식도염",
    probability: 31,
    icon: "🔥",
    description: "위산 역류 가능성이 있습니다.",
  },
  {
    id: "3",
    disease: "방문율",
    probability: 13,
    icon: "📊",
    description: "추가 검진이 필요할 수 있습니다.",
  },
];

export const hospitals: Hospital[] = [
  {
    id: "1",
    name: "가천의료센터",
    address: "서울시 강남구 123 45번지",
    distance: "500m",
    rating: 4.5,
    openingHours: "09:00 ~ 18:00",
    latitude: 37.4979,
    longitude: 127.0276,
    phone: "02-1234-5678",
  },
  {
    id: "2",
    name: "삼성 의료 센터",
    address: "서울시 강남구 456 78번지",
    distance: "1.2km",
    rating: 4.8,
    openingHours: "08:00 ~ 20:00",
    latitude: 37.4888,
    longitude: 127.0326,
    phone: "02-2148-3000",
  },
  {
    id: "3",
    name: "서울의료원",
    address: "서울시 강남구 789 01번지",
    distance: "1.5km",
    rating: 4.3,
    openingHours: "09:00 ~ 19:00",
    latitude: 37.495,
    longitude: 127.04,
    phone: "02-3399-1114",
  },
];

export const navigationItems: NavigationItem[] = [
  { id: "home", name: "home", label: "홈", icon: "🏠" },
  { id: "hospital", name: "hospital", label: "병원", icon: "🏥" },
  { id: "medicine", name: "medicine", label: "약 관리", icon: "💊" },
  { id: "profile", name: "profile", label: "프로필", icon: "👤" },
];
