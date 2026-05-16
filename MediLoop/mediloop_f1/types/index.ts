export interface Symptom {
  id: string;
  name: string;
  icon: string;
}

export interface DiagnosisResult {
  id: string;
  disease: string;
  probability: number;
  icon: string;
  description: string;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  distance: string;
  rating: number;
  openingHours: string;
  latitude: number;
  longitude: number;
  phone?: string;
}

export interface NavigationItem {
  id: string;
  name: string;
  label: string;
  icon: string;
}
