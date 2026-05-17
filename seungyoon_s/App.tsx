import React from 'react';
import Svg, { Path, Circle, Line, Rect, Polyline } from 'react-native-svg';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  Linking,
  Modal,
  SafeAreaView,
  LogBox,
  ScrollView,
  StyleSheet,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Tab = 'home' | 'hospital' | 'fillbag' | 'profile';

type AnalysisResult = {
  summary: {
    topDisease: string;
    confidence: number;
    subtitle: string;
    advice: string;
    diseases: { label: string; value: number }[];
  };
  hospitals: {
    name: string;
    meta: string;
    tone: 'normal' | 'danger';
    address?: string;
    hours?: string;
    phone?: string;
    distance?: string;
    directionQuery?: string;
    reserveQuery?: string;
  }[];
  emergencyHospital?: {
    name: string;
    meta: string;
    tone: 'normal' | 'danger';
    address?: string;
    hours?: string;
    phone?: string;
    distance?: string;
    directionQuery?: string;
    reserveQuery?: string;
  } | null;
};

type HospitalPlace = {
  name: string;
  meta: string;
  tone: 'normal' | 'danger';
  address: string;
  hours: string;
  phone: string;
  distance: string;
  directionQuery?: string;
  reserveQuery?: string;
};

type ReservationInfo = {
  name: string;
  address: string;
  hours: string;
  phone: string;
};

type ReservationHistoryItem = ReservationInfo & {
  id: string;
  source: 'home' | 'hospital';
  reservedAtLabel: string;
  badge: string;
};

type SymptomHistoryItem = {
  id: string;
  dateLabel: string;
  title: string;
  detail: string;
  source: 'home' | 'hospital';
};

type FillBagAnalysis = {
  recommendedHabits: string[];
  avoidFoods: string[];
  criticalWarning: string;
  aiSummary: string;
};

type MealTiming = '식전' | '식후' | '관계없음';
type DoseFrequency = '1일 3회' | '1일 2회' | '수기 입력';

type CareBundle = FillBagAnalysis & {
  hasAnalysis: boolean;
  doctorNote: string;
  mealTiming: MealTiming;
  doseFrequency: DoseFrequency;
  medPushOn: boolean;
  feedbackPushOn: boolean;
  revisitPushOn: boolean;
  updatedAtLabel: string;
};

type Coordinates = {
  latitude: number;
  longitude: number;
};

type SelectedPhoto = {
  uri: string;
  base64: string;
  mimeType: string;
};

type FillBagAnalysisResponse = {
  recommendedHabits: string[];
  avoidFoods: string[];
  criticalWarning: string;
  aiSummary: string;
};

const DEFAULT_COORDINATES: Coordinates = {
  latitude: 37.5665,
  longitude: 126.978,
};

async function fetchCurrentCoordinates(): Promise<Coordinates | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch {
    try {
      const lastKnown = await Location.getLastKnownPositionAsync();
      if (lastKnown) {
        return {
          latitude: lastKnown.coords.latitude,
          longitude: lastKnown.coords.longitude,
        };
      }
    } catch {
      // ignore
    }
    return null;
  }
}

async function resolveActiveLocation(
  currentLocation: Coordinates | null,
  getCurrentLocation: () => Promise<Coordinates | null>,
): Promise<Coordinates | null> {
  const firstAttempt = await getCurrentLocation();
  if (firstAttempt) {
    return firstAttempt;
  }

  if (currentLocation) {
    return currentLocation;
  }

  const liveFix = await waitForLiveLocation(8000);
  if (liveFix) {
    return liveFix;
  }

  await new Promise((resolve) => setTimeout(resolve, 1200));
  return await getCurrentLocation();
}

async function waitForLiveLocation(timeoutMs: number): Promise<Coordinates | null> {
  try {
    return await new Promise((resolve) => {
      let finished = false;
      let subscription: Location.LocationSubscription | null = null;

      const finish = (location: Coordinates | null) => {
        if (finished) {
          return;
        }
        finished = true;
        subscription?.remove();
        resolve(location);
      };

      const timer = setTimeout(() => finish(null), timeoutMs);

      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 1000,
          distanceInterval: 0,
        },
        (location) => {
          clearTimeout(timer);
          finish({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        },
      )
        .then((nextSubscription) => {
          subscription = nextSubscription;
        })
        .catch(() => {
          clearTimeout(timer);
          finish(null);
        });
    });
  } catch {
    return null;
  }
}

LogBox.ignoreAllLogs(true);

const mint = '#5CCAA2';
const mintDark = '#2D9F7A';
const bg = '#F0FAF5';
const text = '#202927';
const sub = '#94B0A7';
const line = '#D7EFE6';
const RAW_API_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.trim() || 'http://10.0.2.2:8080';
const API_BASE_URL = RAW_API_BASE_URL.endsWith('/') ? RAW_API_BASE_URL.slice(0, -1) : RAW_API_BASE_URL;
const DEBUG_INITIAL_SYMPTOM = process.env.EXPO_PUBLIC_DEBUG_SYMPTOM?.trim() || '';
const DEBUG_AUTO_ANALYZE = process.env.EXPO_PUBLIC_AUTO_ANALYZE === '1';

async function postJson<T>(path: string, payload: unknown): Promise<T> {
  const controller = new AbortController();
  const timeoutMs = 90000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await Promise.race([
      fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      }),
      new Promise<Response>((_, reject) => {
        setTimeout(() => reject(new Error('REQUEST_TIMEOUT')), timeoutMs);
      }),
    ]);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

function openNaverMapSearch(placeName: string) {
  const encoded = encodeURIComponent(placeName);
  const appUrl = `nmap://search?query=${encoded}`;
  const webUrl = `https://map.naver.com/v5/search/${encoded}`;

  Linking.openURL(appUrl).catch(() => {
    Linking.openURL(webUrl).catch(() => {
      Alert.alert('Navigation', 'Naver Map could not be opened.');
    });
  });
}

function reservationCareKey(info: { name: string; address: string }) {
  return `${info.name}__${info.address}`.toLowerCase();
}

function defaultCareBundle(base?: FillBagAnalysis | null): CareBundle {
  return {
    hasAnalysis: Boolean(base),
    doctorNote: '',
    recommendedHabits: base?.recommendedHabits ?? ['충분한 수면', '실내 습도 50% 유지', '수분 섭취 1.5L 이상'],
    avoidFoods: base?.avoidFoods ?? ['자극적인 음식', '카페인', '음주 절대 금지'],
    criticalWarning:
      base?.criticalWarning ?? '아세트아미노펜 복용 중 음주는 간 손상의 치명적인 원인이 될 수 있습니다.',
    aiSummary: base?.aiSummary ?? '처방전과 의사 소견을 입력하면 복약 후 관리 요약을 보여드려요.',
    mealTiming: '식전',
    doseFrequency: '1일 3회',
    medPushOn: true,
    feedbackPushOn: true,
    revisitPushOn: false,
    updatedAtLabel: formatReservationStamp(new Date()),
  };
}

export default function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [reservationInfo, setReservationInfo] = useState<ReservationInfo | null>(null);
  const [reservationHistory, setReservationHistory] = useState<ReservationHistoryItem[]>([]);
  const [symptomHistory, setSymptomHistory] = useState<SymptomHistoryItem[]>([]);
  const [careBundles, setCareBundles] = useState<Record<string, CareBundle>>({});
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    let active = true;
    let subscription: Location.LocationSubscription | null = null;
    (async () => {
      try {
        const permission = await Location.getForegroundPermissionsAsync();
        if (!active) {
          return;
        }

        if (permission.status !== 'granted') {
          setCurrentLocation(null);
          return;
        }

        const location = await fetchCurrentCoordinates();
        if (active) {
          setCurrentLocation(location);
        }

        if (active) {
          subscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              timeInterval: 3000,
              distanceInterval: 10,
            },
            (nextLocation) => {
              if (!active) {
                return;
              }
              setCurrentLocation({
                latitude: nextLocation.coords.latitude,
                longitude: nextLocation.coords.longitude,
              });
            },
          );
        }
      } catch {
        if (active) {
          setCurrentLocation(null);
        }
      }
    })();

    return () => {
      active = false;
      subscription?.remove();
    };
  }, []);

  const handleTabChange = (nextTab: Tab) => {
    setTab(nextTab);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    });
  };

  const handleReserve = (info: ReservationInfo, source: 'home' | 'hospital') => {
    setReservationInfo(info);
    const now = new Date();
    const key = reservationCareKey(info);
    const historyItem: ReservationHistoryItem = {
      ...info,
      id: `${source}-${info.name}-${now.getTime()}`,
      source,
      reservedAtLabel: formatReservationStamp(now),
      badge: '예약 완료',
    };
    setReservationHistory((previous) => {
      const filtered = previous.filter((item) => item.name !== info.name || item.address !== info.address);
      return [historyItem, ...filtered].slice(0, 4);
    });
    setCareBundles((previous) => ({
      ...previous,
      [key]: previous[key] ?? defaultCareBundle(),
    }));
  };

  const handleDeleteReservation = (item: ReservationHistoryItem) => {
    const key = reservationCareKey(item);
    setReservationHistory((previous) => previous.filter((reservation) => reservation.id !== item.id));
    setCareBundles((previous) => {
      const next = { ...previous };
      delete next[key];
      return next;
    });
    setReservationInfo((current) =>
      current && current.name === item.name && current.address === item.address ? null : current,
    );
  };

  const handleRecordSymptom = (source: 'home' | 'hospital', query: string, result: AnalysisResult) => {
    const now = new Date();
    const trimmed = query.trim();
    const title = trimmed
      ? trimmed.length > 18
        ? `${trimmed.slice(0, 18)}...`
        : trimmed
      : result.summary.topDisease;
    const detail = result.summary.topDisease
      ? `AI 추정: ${result.summary.topDisease} · ${result.summary.confidence}%`
      : source === 'home'
        ? '홈 자가진단 기록'
        : '병원 검색 기록';

    const item: SymptomHistoryItem = {
      id: `${source}-${now.getTime()}`,
      dateLabel: `${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`,
      title,
      detail,
      source,
    };

    setSymptomHistory((previous) => [item, ...previous].slice(0, 10));
  };

  const handleLogout = () => {
    Alert.alert('로그아웃', '현재 기록과 화면 상태를 초기화하고 홈으로 이동할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: () => {
          setReservationInfo(null);
          setReservationHistory([]);
          setSymptomHistory([]);
          setCareBundles({});
          setShowNotifications(false);
          setTab('home');
          requestAnimationFrame(() => {
            scrollRef.current?.scrollTo({ y: 0, animated: false });
          });
        },
      },
    ]);
  };

  const moveToTab = (nextTab: Tab) => {
    setShowNotifications(false);
    handleTabChange(nextTab);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" hidden />
      <View style={styles.app}>
        <View style={styles.scaler}>
          <Header compact={tab === 'fillbag'} onBellPress={() => setShowNotifications(true)} />
          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.scrollContent,
              tab === 'home' && styles.homeScroll,
              tab === 'hospital' && styles.hospitalScroll,
              tab === 'fillbag' && styles.fillScroll,
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={tab === 'home' ? undefined : styles.hiddenScreen}>
              <HomeScreen
                currentLocation={currentLocation}
                getCurrentLocation={fetchCurrentCoordinates}
                onLocationUpdate={setCurrentLocation}
                onAnalysisComplete={(result, symptomText) => {
                  handleRecordSymptom('home', symptomText, result);
                  setTimeout(() => {
                    scrollRef.current?.scrollTo({ y: 260, animated: true });
                  }, 80);
                }}
                onReserve={(info) => handleReserve(info, 'home')}
              />
            </View>
            <View style={tab === 'hospital' ? undefined : styles.hiddenScreen}>
              <HospitalScreen2
                currentLocation={currentLocation}
                getCurrentLocation={fetchCurrentCoordinates}
                onLocationUpdate={setCurrentLocation}
                onReserve={(info) => handleReserve(info, 'hospital')}
                onSearchComplete={(result, symptomText) => handleRecordSymptom('hospital', symptomText, result)}
              />
            </View>
            <View style={tab === 'fillbag' ? undefined : styles.hiddenScreen}>
              <FillBagScreen2
                reservations={reservationHistory}
                careBundles={careBundles}
                onBundleChange={(reservationKey, bundle) =>
                  setCareBundles((previous) => ({
                    ...previous,
                    [reservationKey]: bundle,
                  }))
                }
                onReserve={(info) => handleReserve(info, 'hospital')}
                onOpenHospitalTab={() => moveToTab('hospital')}
                onDeleteReservation={handleDeleteReservation}
              />
            </View>
            <View style={tab === 'profile' ? undefined : styles.hiddenScreen}>
              <ProfileScreen4
                careBundles={careBundles}
                reservations={reservationHistory}
                symptomHistory={symptomHistory}
                onLogout={handleLogout}
              />
            </View>
          </ScrollView>
          <BottomNav active={tab} onChange={handleTabChange} />
        </View>
      </View>
      {reservationInfo && (
        <Modal transparent visible animationType="fade" onRequestClose={() => setReservationInfo(null)}>
          <View style={styles.reserveOverlay}>
            <View style={styles.reserveSheet}>
              <View style={styles.reserveHeader}>
                <Text style={styles.reserveBadge}>예약 완료</Text>
                <Text style={styles.reserveName}>{reservationInfo.name}</Text>
              </View>
              <View style={styles.reserveCard}>
                <View style={styles.reserveInfoRow}>
                  <Text style={styles.reserveInfoIcon}>⌖</Text>
                  <Text style={styles.reserveInfoText}>{reservationInfo.address}</Text>
                </View>
                <View style={styles.reserveInfoRow}>
                  <Svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <Circle
              cx="12"
              cy="12"
              r="10"
              stroke="#5DCAA5"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Polyline
              points="12 6 12 12 16 14"
              stroke="#5DCAA5"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
                  <Text style={styles.reserveInfoText}>{reservationInfo.hours}</Text>
                </View>
                <View style={styles.reserveInfoRow}>
                  <Svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <Path
                d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"
                stroke="#5DCAA5"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
                  <Text style={styles.reserveInfoText}>{reservationInfo.phone}</Text>
                </View>
              </View>
              <View style={styles.reserveActions}>
                <TouchableOpacity style={styles.reserveCancel} onPress={() => setReservationInfo(null)}>
                  <Text style={styles.reserveCancelText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.reserveConfirm} onPress={() => setReservationInfo(null)}>
                  <Text style={styles.reserveConfirmText}>확인</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
      {showNotifications && (
        <NotificationScreen
          onClose={() => setShowNotifications(false)}
          onOpenFillBag={() => moveToTab('fillbag')}
          onOpenHospital={() => moveToTab('hospital')}
          onOpenProfile={() => moveToTab('profile')}
        />
      )}
    </SafeAreaView>
  );
}

function Header({ compact = false, onBellPress }: { compact?: boolean; onBellPress: () => void }) {
  return (
    <View style={[styles.header, compact && styles.headerCompact]}>
      <Text style={[styles.logo, compact && styles.logoSmall]}>Mediloop</Text>
      <TouchableOpacity style={styles.bell} activeOpacity={0.8} onPress={onBellPress}>
        <BellOutlineIcon />
      </TouchableOpacity>
    </View>
  );
}

function BellOutlineIcon() {
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke={mint}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13.73 21a2 2 0 0 1-3.46 0"
        stroke={mint}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function NotificationScreen({
  onClose,
  onOpenFillBag,
  onOpenHospital,
  onOpenProfile,
}: {
  onClose: () => void;
  onOpenFillBag: () => void;
  onOpenHospital: () => void;
  onOpenProfile: () => void;
}) {
  const notifications = [
    {
      tone: 'care' as const,
      title: 'Feedback Loop Alert',
      time: '오전 9:00',
      heading: '복용 상태 확인',
      body: '복용 중인 약의 효과를 확인하고 있어요. 현재 상태를 알려주세요.',
      primary: '예, 나아졌어요',
      secondary: '아직 아파요',
      onPrimary: () =>
        Alert.alert('상태 업데이트', '회복 상태를 기록했어요. 필요하면 나중에 다시 확인할게요.', [
          { text: '확인', onPress: onClose },
        ]),
      onSecondary: onOpenFillBag,
    },
    {
      tone: 'danger' as const,
      title: 'Side Effect Alert',
      time: '오전 11:00',
      heading: '어지럼증·두드러기',
      body: '어지럼증이나 두드러기 같은 부작용 증상이 나타날 수 있어요. 현재 이런 증상이 있나요?',
      primary: '증상 있어요',
      secondary: '괜찮아요',
      onPrimary: onOpenHospital,
      onSecondary: () =>
        Alert.alert('상태 확인', '현재 이상 반응이 없다고 기록했어요.', [{ text: '확인', onPress: onClose }]),
    },
    {
      tone: 'care' as const,
      title: 'Hospital Revisit Recommendation',
      time: '오후 2:00',
      heading: '증상 지속 안내',
      body: '증상이 3일 이상 지속되고 있어요. 가까운 병원을 다시 찾아드릴게요.',
      primary: '예약하기',
      secondary: '나중에',
      onPrimary: onOpenHospital,
      onSecondary: () =>
        Alert.alert('알림 보관', '나중에 다시 확인할 수 있게 알림을 남겨둘게요.', [
          { text: '확인', onPress: onClose },
        ]),
    },
  ];

  return (
    <Modal transparent visible animationType="slide" onRequestClose={onClose}>
      <View style={styles.notificationOverlay}>
        <View style={styles.notificationSheet}>
          <View style={styles.notificationHeader}>
            <TouchableOpacity style={styles.notificationBack} onPress={onClose}>
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M15 18l-6-6 6-6"
                  stroke="#2C2C2A"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
            <Text style={styles.notificationTitle}>알림</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.notificationReadAll}>모두읽음</Text>
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
            {notifications.map((item) => (
              <View key={item.title} style={[styles.notificationCard, item.tone === 'danger' && styles.notificationCardDanger]}>
                <View style={[styles.notificationCardTop, item.tone === 'danger' && styles.notificationCardTopDanger]}>
                  <Text style={[styles.notificationCardTitle, item.tone === 'danger' && styles.notificationCardTitleDanger]}>{item.title}</Text>
                  <Text style={styles.notificationCardTime}>{item.time}</Text>
                </View>
                <View style={styles.notificationCardBody}>
                  <Text style={styles.notificationCardBodyTitle}>{item.heading}</Text>
                  <Text style={styles.notificationCardBodyText}>{item.body}</Text>
                  <View style={styles.notificationActionRow}>
                    <TouchableOpacity
                      style={[styles.notificationPrimary, item.tone === 'danger' && styles.notificationPrimaryDanger]}
                      onPress={item.onPrimary}
                    >
                      <Text style={styles.notificationPrimaryText}>{item.primary}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.notificationSecondary} onPress={item.onSecondary}>
                      <Text style={styles.notificationSecondaryText}>{item.secondary}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function createMockAnalysis(symptomText: string, hasPhoto: boolean): AnalysisResult {
  const hasDigestiveKeyword = /메스|복통|설사|장염|소화/.test(symptomText);
  const top = hasDigestiveKeyword ? '급성 위장염' : '감기(상기도 감염)';

  return {
    summary: {
      topDisease: top,
      confidence: hasDigestiveKeyword ? 62 : 56,
      subtitle: hasPhoto ? '사진과 증상을 함께 반영한 추정 결과입니다.' : '증상 기반 추정 결과입니다.',
      advice: hasDigestiveKeyword
        ? '수분을 충분히 섭취하고 자극적인 음식은 피하세요. 증상이 심하면 병원 방문을 권장합니다.'
        : '충분한 휴식과 수분 섭취를 권장합니다. 발열이 지속되면 병원 방문을 권장합니다.',
      diseases: hasDigestiveKeyword
        ? [
            { label: '급성 위장염', value: 62 },
            { label: '소화불량', value: 28 },
            { label: '장염', value: 10 },
          ]
        : [
            { label: '감기(상기도 감염)', value: 56 },
            { label: '편도염', value: 31 },
            { label: '기관지염', value: 13 },
          ],
    },
    hospitals: [
      { name: '가천의료센터', meta: '450m · 서울시 강남구 123 45번지', tone: 'normal' },
      { name: '삼성 의료 센터', meta: '1.2km · 서울시 강남구 456 78번지', tone: 'danger' },
    ],
  };
}

function toHospitalPlaces(result: AnalysisResult): HospitalPlace[] {
  const combined = [...result.hospitals];
  if (result.emergencyHospital) {
    combined.push(result.emergencyHospital);
  }

  const unique = new Map<string, HospitalPlace>();
  for (const hospital of combined) {
    const address = hospital.address ?? hospital.meta;
    const key = `${hospital.name}::${address}`;
    if (unique.has(key)) {
      continue;
    }

    unique.set(key, {
      name: hospital.name,
      meta: hospital.meta,
      tone: hospital.tone,
      address,
      hours: hospital.hours ?? '09:00 ~ 18:00',
      phone: hospital.phone ?? '02-0000-0000',
      distance: hospital.distance ?? '500m',
      directionQuery: hospital.directionQuery ?? hospital.name,
      reserveQuery: hospital.reserveQuery ?? hospital.name,
    });
  }

  return Array.from(unique.values());
}

function toHospitalPlace(
  hospital: AnalysisResult['hospitals'][number] | AnalysisResult['emergencyHospital'],
): HospitalPlace | null {
  if (!hospital) {
    return null;
  }

  return {
    name: hospital.name,
    meta: hospital.meta,
    tone: hospital.tone,
    address: hospital.address ?? hospital.meta,
    hours: hospital.hours ?? '09:00 ~ 18:00',
    phone: hospital.phone ?? '02-0000-0000',
    distance: hospital.distance ?? '500m',
    directionQuery: hospital.directionQuery ?? hospital.name,
    reserveQuery: hospital.reserveQuery ?? hospital.name,
  };
}

function formatReservationStamp(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = date.getHours();
  const min = String(date.getMinutes()).padStart(2, '0');
  const period = hh >= 12 ? '오후' : '오전';
  const hour12 = hh % 12 || 12;
  return `${yyyy}.${mm}.${dd} ${period} ${hour12}:${min}`;
}

function HomeScreen({
  currentLocation,
  getCurrentLocation,
  onLocationUpdate,
  onAnalysisComplete,
  onReserve,
}: {
  currentLocation: Coordinates | null;
  getCurrentLocation: () => Promise<Coordinates | null>;
  onLocationUpdate: (location: Coordinates) => void;
  onAnalysisComplete: (result: AnalysisResult, symptomText: string) => void;
  onReserve: (info: ReservationInfo) => void;
}) {
  const [symptomText, setSymptomText] = useState(DEBUG_INITIAL_SYMPTOM);
  const [selectedPhoto, setSelectedPhoto] = useState<SelectedPhoto | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const hasPhoto = Boolean(selectedPhoto);
  const primaryHospital = analysisResult?.hospitals.find((hospital) => hospital.tone !== 'danger') ?? analysisResult?.hospitals[0] ?? null;
  const emergencyHospital = analysisResult?.emergencyHospital ?? analysisResult?.hospitals.find((hospital) => hospital.tone === 'danger') ?? null;

  const handlePickPhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('사진 권한 필요', '사진을 불러오려면 앨범 접근 권한이 필요합니다.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        base64: true,
        allowsEditing: false,
      });

      if (result.canceled || !Array.isArray(result.assets) || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      setSelectedPhoto({
        uri: asset.uri,
        base64: asset.base64 ?? '',
        mimeType: asset.mimeType ?? 'image/jpeg',
      });
    } catch (error) {
      console.warn('[ImagePicker]', error);
      Alert.alert('사진 선택 실패', '앨범에서 사진을 불러오지 못했습니다.');
    }
  };

  const handleDiagnose = async () => {
    if (!hasPhoto && !symptomText.trim()) {
      Alert.alert('입력 필요', '사진을 업로드하거나 증상을 입력해주세요.');
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    try {
      const activeLocation =
        (await resolveActiveLocation(currentLocation, getCurrentLocation)) ?? currentLocation ?? DEFAULT_COORDINATES;
      onLocationUpdate(activeLocation);
      const result = await postJson<AnalysisResult>('/api/home/analyze', {
        symptomText,
        hasPhoto,
        imageBase64: selectedPhoto?.base64 ?? null,
        imageMimeType: selectedPhoto?.mimeType ?? null,
        latitude: activeLocation.latitude,
        longitude: activeLocation.longitude,
      });
      setAnalysisResult(result);
      onAnalysisComplete(result, symptomText);
    } catch (error) {
      console.warn('[HomeAnalyze]', error);
      Alert.alert('분석 실패', 'AI 분석 또는 병원 추천을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const debugAutoRanRef = useRef(false);

  useEffect(() => {
    if (!DEBUG_AUTO_ANALYZE || debugAutoRanRef.current || loading || analysisResult || !symptomText.trim()) {
      return;
    }
    debugAutoRanRef.current = true;
    void handleDiagnose();
  }, [loading, analysisResult, symptomText]);

  return (
    <>
      <View style={styles.diagnosisCard}>
        <View style={styles.hero}>
          <Text style={styles.heroSmall}>안녕하세요</Text>
          <Text style={styles.heroTitle}>오늘 어디가 불편하세요?</Text>
        </View>
        <View style={styles.cardBody}>
          <Label
            text="증상 사진 첨부 (선택)"
            customIcon={
            <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginRight: 6 }}>
            <Path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" stroke="#5DCAA5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <Circle cx="12" cy="13" r="3" stroke="#5DCAA5" strokeWidth="1.8"/>
          </Svg>
        }
/>
          <TouchableOpacity
            style={styles.uploadBox}
            onPress={handlePickPhoto}
          >
            <View style={styles.uploadIconWrap}>
              {selectedPhoto?.uri ? (
                <Image source={{ uri: selectedPhoto.uri }} style={styles.uploadPreview} />
              ) : (
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
  <Path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" stroke="#5DCAA5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  <Circle cx="12" cy="13" r="3" stroke="#5DCAA5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  <Line x1="12" y1="11" x2="12" y2="9" stroke="#5DCAA5" strokeWidth="1.8" strokeLinecap="round"/>
  <Line x1="11" y1="10" x2="13" y2="10" stroke="#5DCAA5" strokeWidth="1.8" strokeLinecap="round"/>
</Svg>
              )}
            </View>
            <Text style={styles.uploadText}>{selectedPhoto ? '사진 선택됨' : '사진 업로드'}</Text>
          </TouchableOpacity>
          {selectedPhoto && <Text style={styles.photoSelectedHint}>선택한 사진을 함께 분석해요.</Text>}
          <Label
  text="증상 직접 입력"
  customIcon={
    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginRight: 6 }}>
      <Path d="M12 20h9" stroke="#5DCAA5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" stroke="#5DCAA5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  }
/>
          <TextInput
            multiline
            value={symptomText}
            onChangeText={setSymptomText}
            placeholder={'증상과 기저질환을 자세하게 작성해주세요.\n예: 3일째 두통이 심하고 속이 메스꺼워요.'}
            placeholderTextColor="#A9BFB7"
            style={styles.textArea}
          />
          <TouchableOpacity style={styles.primaryButton} onPress={handleDiagnose}>
            <Text style={styles.primaryButtonText}>{loading ? '분석 중...' : 'AI 자가진단 시작'}</Text>
          </TouchableOpacity>
          <Text style={styles.disclaimer}>본 결과는 참고용이며 정확한 진단은 의사에게 문의하세요.</Text>
        </View>
      </View>

      {analysisResult && (
        <>
          <View style={styles.resultCard}>
            <View style={[styles.resultHeader, styles.summaryResultHeader]}>
              <Text style={styles.sectionTitle}>분석 결과 요약</Text>
              <View style={styles.pill}>
                <Text style={styles.pillText}>AI 진단 추정</Text>
              </View>
            </View>
            <View style={styles.resultMain}>
              <View style={styles.resultMainLeft}>
                <Text style={styles.diseaseTitle}>{analysisResult.summary.topDisease}</Text>
                <Text style={styles.diseaseSub}>{analysisResult.summary.subtitle}</Text>
              </View>
              <View style={styles.circle}>
                <Text style={styles.circleText}>{analysisResult.summary.confidence}%</Text>
              </View>
            </View>
            {analysisResult.summary.diseases.map((disease) => (
              <Progress key={disease.label} label={disease.label} value={disease.value} />
            ))}
            <View style={styles.adviceBox}>
              <Text style={styles.adviceText}>{analysisResult.summary.advice}</Text>
            </View>
          </View>

          <View style={styles.recommendCard}>
            {primaryHospital && (
              <>
                <Text style={styles.hospitalSectionTitle}>주변 추천 병원</Text>
                <HospitalMini2
                  key={`primary-${primaryHospital.name}`}
                  name={primaryHospital.name}
                  meta={primaryHospital.meta}
                  tone={primaryHospital.tone}
                  directionQuery={primaryHospital.directionQuery}
                  onReserve={() =>
                    onReserve({
                      name: primaryHospital.name,
                      address: primaryHospital.address ?? primaryHospital.meta,
                      hours: primaryHospital.hours ?? '09:00 ~ 18:00',
                      phone: primaryHospital.phone ?? '02-1234-5678',
                    })
                  }
                />
              </>
            )}
            {emergencyHospital && (
              <>
                <Text style={[styles.hospitalSectionTitle, styles.emergencySectionTitle]}>응급 병원 추천</Text>
                <HospitalMini2
                  key={`emergency-${emergencyHospital.name}`}
                  name={emergencyHospital.name}
                  meta={emergencyHospital.meta}
                  tone={emergencyHospital.tone}
                  directionQuery={emergencyHospital.directionQuery}
                  onReserve={() =>
                    onReserve({
                      name: emergencyHospital.name,
                      address: emergencyHospital.address ?? emergencyHospital.meta,
                      hours: emergencyHospital.hours ?? '09:00 ~ 18:00',
                      phone: emergencyHospital.phone ?? '02-1234-5678',
                    })
                  }
                />
              </>
            )}
            <Text style={styles.bottomNote}>AI 분석은 참고용이며 의학적 진단이 아닙니다.</Text>
          </View>
        </>
      )}
    </>
  );
}

function HospitalScreen() {
  const [selectedHospital, setSelectedHospital] = useState<HospitalPlace | null>(null);
  const [hospitalQuery, setHospitalQuery] = useState('');
  const [showHospitalResults, setShowHospitalResults] = useState(false);

  return (
    <>
      <View style={styles.hospitalPage}>
        <View style={styles.searchBar}>
          <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <Circle
                    cx="11"
                    cy="11"
                    r="8"
                    stroke="#fff"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <Line
                    x1="21"
                    y1="21"
                    x2="16.65"
                    y2="16.65"
                    stroke="#fff"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </Svg>
          <TextInput
            value={hospitalQuery}
            onChangeText={(value) => {
              setHospitalQuery(value);
              if (!value.trim()) {
                setShowHospitalResults(false);
              }
            }}
            placeholder="증상과 기저질환을 입력해주세요."
            placeholderTextColor={sub}
            style={styles.hospitalSearchInput}
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => {
              if (!hospitalQuery.trim()) {
                Alert.alert('검색어 입력', '증상이나 기저질환을 입력해주세요.');
                return;
              }
              Keyboard.dismiss();
              setShowHospitalResults(true);
            }}
          >
            <Text style={styles.searchButtonText}>검색</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.hospitalDiagnosisRow}>
          <Text style={styles.hospitalDiagnosisTitle}>단순 감기</Text>
          <View style={styles.hospitalInlineTrack}>
            <View style={styles.hospitalInlineFill} />
          </View>
          <Text style={styles.hospitalInlinePercent}>85%</Text>
          <View style={styles.hospitalInfoCircle}>
            <Text style={styles.hospitalInfoText}>i</Text>
          </View>
        </View>
        <MapMock />
        {showHospitalResults && (
          <>
            <Text style={styles.hospitalSectionTitle}>주변 추천 병원</Text>
            {[].map((hospital) => (
              <HospitalList
                key={(hospital as HospitalPlace).name}
                name={(hospital as HospitalPlace).name}
                meta={(hospital as HospitalPlace).meta}
                onPress={() => setSelectedHospital(hospital as HospitalPlace)}
              />
            ))}
          </>
        )}
      </View>

      {selectedHospital && (
        <Modal transparent visible animationType="slide" onRequestClose={() => setSelectedHospital(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <TouchableOpacity style={styles.sheetGrabber} onPress={() => setSelectedHospital(null)}>
              <View style={styles.sheetGrabberBar} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetClose} onPress={() => setSelectedHospital(null)}>
              <Text style={styles.sheetCloseText}>×</Text>
            </TouchableOpacity>
            <Text style={styles.sheetHospitalName}>{selectedHospital.name}</Text>
            <View style={styles.sheetInfoRow}>
              <Text style={styles.sheetInfoIcon}>⌖</Text>
              <Text style={styles.sheetInfoText}>{selectedHospital.address}</Text>
            </View>
            <View style={styles.sheetInfoRow}>
              <Svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <Circle
              cx="12"
              cy="12"
              r="10"
              stroke="#5DCAA5"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Polyline
              points="12 6 12 12 16 14"
              stroke="#5DCAA5"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
              <Text style={styles.sheetInfoText}>{selectedHospital.hours}</Text>
            </View>
            <View style={styles.sheetInfoRow}>
              <Svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <Path
                d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"
                stroke="#5DCAA5"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
              <Text style={styles.sheetInfoText}>{selectedHospital.phone}</Text>
            </View>
            <View style={styles.sheetRatingRow}>
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="#F3C522" style={{ marginRight: 8 }}>
  <Path
    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
    fill="#F3C522"
    stroke="#F3C522"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
</Svg>
              <Text style={styles.sheetRating}>4.5 · {selectedHospital.distance}</Text>
            </View>
            <View style={styles.sheetActionRow}>
              <TouchableOpacity
                style={styles.sheetReserveButton}
                onPress={() => Alert.alert('예약하기', `${selectedHospital.name} 예약 화면으로 이동합니다.`)}
              >
                <Text style={styles.sheetReserveText}>예약하기</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sheetMapButton}
                onPress={() => openNaverMapSearch(selectedHospital.directionQuery ?? selectedHospital.name)}
              >
                <Text style={styles.sheetMapText}>네이버지도</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </Modal>
      )}
    </>
  );
}

function Label({ icon, text: value, customIcon }: { icon?: string; text: string; customIcon?: React.ReactNode }) {
  return (
    <View style={styles.labelRow}>
      {customIcon ? customIcon : <Text style={styles.labelIcon}>{icon}</Text>}
      <Text style={styles.labelText}>{value}</Text>
    </View>
  );
}

function Progress({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.progressBlock}>
      <View style={styles.progressTop}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressValue}>{value}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${value}%` }]} />
      </View>
    </View>
  );
}

function HospitalMini({
  name,
  meta = '媛뺣궓援??뚰뿤?濡?123 쨌 450m',
  tone,
  directionQuery,
}: {
  name: string;
  meta?: string;
  tone: 'normal' | 'danger';
  directionQuery?: string;
}) {
  const danger = tone === 'danger';
  return (
    <View style={[styles.miniHospital, danger && styles.miniHospitalDanger]}>
      <View style={[styles.tag, danger && styles.tagDanger]}>
        <Text style={[styles.tagText, danger && styles.tagTextDanger]}>{danger ? '응급 병원' : '영업중'}</Text>
      </View>
      <Text style={styles.hospitalName}>{name}</Text>
      <Text style={styles.hospitalMeta}>• {meta}</Text>
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.reserveBtn, danger && styles.reserveBtnGhost]}
          onPress={() => Alert.alert('예약하기', `${name} 예약 화면으로 이동합니다.`)}
        >
          <Text style={[styles.reserveText, danger && styles.reserveTextGhost]}>예약하기</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navBtn, danger && styles.navBtnDanger]}
          onPress={() => openNaverMapSearch(directionQuery ?? name)}
        >
          <Text style={[styles.navText, danger && styles.navTextDanger]}>길찾기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function HospitalList({
  name,
  meta,
  compact = false,
  directionQuery,
  onPress,
}: {
  name: string;
  meta: string;
  compact?: boolean;
  directionQuery?: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.92}
      style={[styles.hospitalList, compact && styles.hospitalListCompact]}
      onPress={onPress}
    >
      <View style={styles.openTag}>
        <Text style={styles.openTagText}>영업중</Text>
      </View>
      <Text style={styles.listName}>{name}</Text>
      <Text style={styles.listMeta}>{meta}</Text>
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.listReserve}
          onPress={() => Alert.alert('예약하기', `${name} 예약 화면으로 이동합니다.`)}
        >
          <Text style={styles.listReserveText}>예약하기</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.listMap}
          onPress={() => openNaverMapSearch(directionQuery ?? name)}
        >
          <Text style={styles.listMapText}>네이버지도</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function MapMock() {
  return (
    <View style={styles.map}>
      <View style={styles.mapCanvas}>
        <View style={[styles.mapBuilding, styles.mapBuildingA]} />
        <View style={[styles.mapBuilding, styles.mapBuildingB]} />
        <View style={[styles.mapBuilding, styles.mapBuildingC]} />
        <View style={[styles.mapBuilding, styles.mapBuildingD]} />
        <View style={[styles.mapBuilding, styles.mapBuildingE]} />
        <View style={[styles.mapBuilding, styles.mapBuildingF]} />
        <View style={[styles.mapBuilding, styles.mapBuildingG]} />
        <View style={[styles.mapBuilding, styles.mapBuildingH]} />
        <View style={[styles.mapBuilding, styles.mapBuildingI]} />
        <View style={[styles.mapBuilding, styles.mapBuildingJ]} />
        <View style={[styles.road, styles.roadA]} />
        <View style={[styles.road, styles.roadB]} />
        <View style={[styles.road, styles.roadC]} />
        <View style={[styles.road, styles.roadD]} />
        <View style={[styles.road, styles.roadE]} />
        <View style={[styles.road, styles.roadF]} />
        <Text style={[styles.mapRoadText, { left: 60, top: 26, transform: [{ rotate: '-18deg' }] }]}>언주로63길</Text>
        <Text style={[styles.mapRoadText, { left: 166, top: 104, transform: [{ rotate: '-18deg' }] }]}>언주로63길</Text>
        <Text style={[styles.mapRoadText, { left: 194, top: 172, transform: [{ rotate: '-18deg' }] }]}>도곡로</Text>
        <Text style={[styles.mapRoadText, { right: 18, top: 156, transform: [{ rotate: '68deg' }] }]}>도곡로</Text>
      </View>
      <View style={styles.mapTabs}>
        <Text style={styles.mapTabActive}>가까운순</Text>
        <Text style={styles.mapTab}>별점순</Text>
        <Text style={styles.mapTab}>리뷰순</Text>
      </View>
      <View style={styles.mapPin}>
        <View style={styles.mapPinInner} />
      </View>
      <View style={styles.mapMarkerLabel}>
        <Text style={styles.mapMarkerText}>강남연세내과</Text>
      </View>
    </View>
  );
}

function HospitalMini2({
  name,
  meta = '450m',
  tone,
  directionQuery,
  onReserve,
}: {
  name: string;
  meta?: string;
  tone: 'normal' | 'danger';
  directionQuery?: string;
  onReserve: () => void;
}) {
  const danger = tone === 'danger';

  return (
    <View style={[styles.miniHospital, danger && styles.miniHospitalDanger]}>
      <View style={[styles.tag, danger && styles.tagDanger]}>
        <Text style={[styles.tagText, danger && styles.tagTextDanger]}>{danger ? '응급 병원' : '영업중'}</Text>
      </View>
      <Text style={styles.hospitalName}>{name}</Text>
      <Text style={styles.hospitalMeta}>{meta}</Text>
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.reserveBtn, danger && styles.reserveBtnGhost]}
          onPress={onReserve}
        >
          <Text style={[styles.reserveText, danger && styles.reserveTextGhost]}>예약하기</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navBtn, danger && styles.navBtnDanger]}
          onPress={() => openNaverMapSearch(directionQuery ?? name)}
        >
          <Text style={[styles.navText, danger && styles.navTextDanger]}>길찾기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function HospitalList2({
  name,
  meta,
  tone,
  address,
  hours,
  phone,
  compact = false,
  directionQuery,
  onPress,
  onReserve,
}: {
  name: string;
  meta: string;
  tone: 'normal' | 'danger';
  address: string;
  hours: string;
  phone: string;
  compact?: boolean;
  directionQuery?: string;
  onPress?: () => void;
  onReserve: () => void;
}) {
  const danger = tone === 'danger';

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      style={[styles.hospitalList, compact && styles.hospitalListCompact]}
      onPress={onPress}
    >
      <View style={[styles.openTag, danger && styles.tagDanger]}>
        <Text style={[styles.openTagText, danger && styles.tagTextDanger]}>{danger ? '응급 병원' : '영업중'}</Text>
      </View>
      <Text style={styles.listName}>{name}</Text>
      <Text style={styles.listMeta}>{meta}</Text>
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.listReserve} onPress={onReserve}>
          <Text style={styles.listReserveText}>▣ 예약하기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.listMap} onPress={() => openNaverMapSearch(directionQuery ?? name)}>
          <Text style={styles.listMapText}>네이버지도</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function HospitalScreen2({
  currentLocation,
  getCurrentLocation,
  onLocationUpdate,
  onReserve,
  onSearchComplete,
}: {
  currentLocation: Coordinates | null;
  getCurrentLocation: () => Promise<Coordinates | null>;
  onLocationUpdate: (location: Coordinates) => void;
  onReserve: (info: ReservationInfo) => void;
  onSearchComplete: (result: AnalysisResult, symptomText: string) => void;
}) {
  const [selectedHospital, setSelectedHospital] = useState<HospitalPlace | null>(null);
  const [hospitalQuery, setHospitalQuery] = useState('');
  const [showHospitalResults, setShowHospitalResults] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [recommendations, setRecommendations] = useState<HospitalPlace[]>([]);
  const [searching, setSearching] = useState(false);
  const emergencyHospital = toHospitalPlace(analysisResult?.emergencyHospital ?? null);
  const recommendedHospitals = recommendations.filter((hospital) => hospital.tone !== 'danger');

  const handleSearch = async () => {
    if (!hospitalQuery.trim()) {
      Alert.alert('검색어 입력', '증상이나 기저질환을 입력해주세요.');
      return;
    }

    Keyboard.dismiss();
    setSelectedHospital(null);
    setSearching(true);
    try {
      const activeLocation =
        (await resolveActiveLocation(currentLocation, getCurrentLocation)) ?? currentLocation ?? DEFAULT_COORDINATES;
      onLocationUpdate(activeLocation);
      const result = await postJson<AnalysisResult>('/api/hospital/analyze', {
        symptomText: hospitalQuery,
        conditionText: hospitalQuery,
        imageBase64: null,
        imageMimeType: null,
        latitude: activeLocation.latitude,
        longitude: activeLocation.longitude,
      });
      setAnalysisResult(result);
      setRecommendations(toHospitalPlaces(result));
      setShowHospitalResults(true);
      onSearchComplete(result, hospitalQuery);
    } catch (error) {
      console.warn('[HospitalAnalyze]', error);
      Alert.alert('검색 실패', 'AI 분석 또는 병원 추천을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <>
      <View style={styles.hospitalPage}>
        <View style={styles.searchBar}>
          <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <Circle
                    cx="11"
                    cy="11"
                    r="8"
                    stroke="#fff"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <Line
                    x1="21"
                    y1="21"
                    x2="16.65"
                    y2="16.65"
                    stroke="#fff"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </Svg>
          <TextInput
            value={hospitalQuery}
            onChangeText={(value) => {
              setHospitalQuery(value);
              if (!value.trim()) {
                setShowHospitalResults(false);
              }
            }}
            placeholder="증상과 기저질환을 입력해주세요."
            placeholderTextColor={sub}
            style={styles.hospitalSearchInput}
          />
          <TouchableOpacity
            style={[styles.searchButton, searching && styles.searchButtonDisabled]}
            onPress={handleSearch}
            disabled={searching}
          >
            <Text style={styles.searchButtonText}>{searching ? '검색중...' : '검색'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.hospitalDiagnosisRow}>
          <Text style={styles.hospitalDiagnosisTitle} numberOfLines={2}>
            {analysisResult?.summary.topDisease ?? '단순 감기'}
          </Text>
          <View style={styles.hospitalInlineTrack}>
            <View style={[styles.hospitalInlineFill, { width: `${analysisResult?.summary.confidence ?? 85}%` }]} />
          </View>
          <Text style={styles.hospitalInlinePercent}>{analysisResult?.summary.confidence ?? 85}%</Text>
          <View style={styles.hospitalInfoCircle}>
            <Text style={styles.hospitalInfoText}>i</Text>
          </View>
        </View>
        <MapMock />
        {showHospitalResults && (
          <>
            <Text style={styles.hospitalSectionTitle}>주변 추천 병원</Text>
            {recommendedHospitals.map((hospital) => (
              <HospitalList2
                key={hospital.name}
                name={hospital.name}
                meta={hospital.meta}
                tone={hospital.tone}
                address={hospital.address}
                hours={hospital.hours}
                phone={hospital.phone}
                directionQuery={hospital.directionQuery}
                onPress={() => setSelectedHospital(hospital)}
                onReserve={() =>
                  onReserve({
                    name: hospital.name,
                    address: hospital.address,
                    hours: hospital.hours,
                    phone: hospital.phone,
                  })
                }
              />
            ))}
            {emergencyHospital && (
              <>
                <Text style={[styles.hospitalSectionTitle, styles.emergencySectionTitle]}>응급 병원 추천</Text>
                <HospitalList2
                  key={`emergency-${emergencyHospital.name}`}
                  name={emergencyHospital.name}
                  meta={emergencyHospital.meta}
                  tone={emergencyHospital.tone}
                  address={emergencyHospital.address}
                  hours={emergencyHospital.hours}
                  phone={emergencyHospital.phone}
                  directionQuery={emergencyHospital.directionQuery}
                  onPress={() => setSelectedHospital(emergencyHospital)}
                  onReserve={() =>
                    onReserve({
                      name: emergencyHospital.name,
                      address: emergencyHospital.address,
                      hours: emergencyHospital.hours,
                      phone: emergencyHospital.phone,
                    })
                  }
                />
              </>
            )}
          </>
        )}
      </View>

      {selectedHospital && (
        <Modal transparent visible animationType="slide" onRequestClose={() => setSelectedHospital(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.bottomSheet}>
              <TouchableOpacity style={styles.sheetGrabber} onPress={() => setSelectedHospital(null)}>
                <View style={styles.sheetGrabberBar} />
              </TouchableOpacity>
              <Text style={styles.sheetHospitalName}>{selectedHospital.name}</Text>
              <View style={styles.sheetInfoRow}>
                <Svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <Path
              d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"
              stroke="#5DCAA5"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Circle
              cx="12"
              cy="10"
              r="3"
              stroke="#5DCAA5"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
                <Text style={styles.sheetInfoText}>{selectedHospital.address}</Text>
              </View>
              <View style={styles.sheetInfoRow}>
                <Svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <Circle
              cx="12"
              cy="12"
              r="10"
              stroke="#5DCAA5"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Polyline
              points="12 6 12 12 16 14"
              stroke="#5DCAA5"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
                <Text style={styles.sheetInfoText}>{selectedHospital.hours}</Text>
              </View>
              <View style={styles.sheetInfoRow}>
                <Svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <Path
                d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"
                stroke="#5DCAA5"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
                <Text style={styles.sheetInfoText}>{selectedHospital.phone}</Text>
              </View>
              <View style={styles.sheetRatingRow}>
                <Svg width="16" height="16" viewBox="0 0 24 24" fill="#F3C522" style={{ marginRight: 8 }}>
  <Path
    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
    fill="#F3C522"
    stroke="#F3C522"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
</Svg>
                <Text style={styles.sheetRating}>4.5 · {selectedHospital.distance}</Text>
              </View>
              <View style={styles.sheetActionRow}>
                <TouchableOpacity
                  style={styles.sheetReserveButton}
                  onPress={() =>
                    onReserve({
                      name: selectedHospital.name,
                      address: selectedHospital.address,
                      hours: selectedHospital.hours,
                      phone: selectedHospital.phone,
                    })
                  }
                >
                  <Text style={styles.sheetReserveText}>예약하기</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sheetMapButton}
                  onPress={() => openNaverMapSearch(selectedHospital.directionQuery ?? selectedHospital.name)}
                >
                  <Text style={styles.sheetMapText}>길찾기</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

function ProfileScreen2() {
  const [showHistory, setShowHistory] = useState(true);
  const records = [
    { title: '두통', detail: '2026.05.14 · 2주 · 경과 관찰' },
    { title: '목감기', detail: '2026.05.10 · 1주 · 완화' },
    { title: '손목 통증', detail: '2026.05.02 · 2주 · 치료' },
  ];

  return (
    <View style={styles.whiteCard}>
      <View style={styles.profileHeaderRow}>
        <Text style={styles.sectionTitle}>지난 증상 기록</Text>
        <TouchableOpacity style={styles.profileToggleButton} onPress={() => setShowHistory((value) => !value)}>
          <Text style={styles.profileToggleButtonText}>{showHistory ? '접기' : '전체보기'}</Text>
        </TouchableOpacity>
      </View>
      {showHistory && (
        <View style={styles.profileHistoryList}>
          {records.map((record) => (
            <View key={record.title} style={styles.profileHistoryItem}>
              <Text style={styles.profileHistoryTitle}>{record.title}</Text>
              <Text style={styles.profileHistoryDetail}>{record.detail}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function FillBagScreen2({
  reservations,
  careBundles,
  onBundleChange,
  onReserve,
  onOpenHospitalTab,
  onDeleteReservation,
}: {
  reservations: ReservationHistoryItem[];
  careBundles: Record<string, CareBundle>;
  onBundleChange: (reservationKey: string, bundle: CareBundle) => void;
  onReserve: (info: ReservationInfo) => void;
  onOpenHospitalTab: () => void;
  onDeleteReservation: (item: ReservationHistoryItem) => void;
}) {
  const [mode, setMode] = useState<'care' | 'meds'>('care');
  const [drafts, setDrafts] = useState<Record<string, { memo: string; prescriptionPhoto: SelectedPhoto | null }>>({});
  const [analysisReady, setAnalysisReady] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [expandedReservationId, setExpandedReservationId] = useState<string | null>(null);
  const [mealTiming, setMealTiming] = useState<MealTiming>('식전');
  const [doseFrequency, setDoseFrequency] = useState<DoseFrequency>('1일 3회');
  const [medPushOn, setMedPushOn] = useState(true);
  const [feedbackPushOn, setFeedbackPushOn] = useState(true);
  const [revisitPushOn, setRevisitPushOn] = useState(false);

  useEffect(() => {
    if (reservations.length === 0) {
      if (expandedReservationId !== null) {
        setExpandedReservationId(null);
      }
      return;
    }

    if (expandedReservationId && !reservations.some((item) => item.id === expandedReservationId)) {
      setExpandedReservationId(reservations[0].id);
    }
  }, [reservations, expandedReservationId]);

  const selectedReservation =
    reservations.find((item) => item.id === expandedReservationId) ?? reservations[0] ?? null;
  const effectiveReservationKey = selectedReservation ? reservationCareKey(selectedReservation) : 'default';
  const selectedBundle = careBundles[effectiveReservationKey] ?? defaultCareBundle();
  const activeDraft = drafts[effectiveReservationKey] ?? { memo: '', prescriptionPhoto: null };
  const memo = activeDraft.memo;
  const prescriptionPhoto = activeDraft.prescriptionPhoto;
  const hasPrescription = Boolean(prescriptionPhoto);

  useEffect(() => {
    setMealTiming(selectedBundle.mealTiming);
    setDoseFrequency(selectedBundle.doseFrequency);
    setMedPushOn(selectedBundle.medPushOn);
    setFeedbackPushOn(selectedBundle.feedbackPushOn);
    setRevisitPushOn(selectedBundle.revisitPushOn);
    setAnalysisReady(Boolean(careBundles[effectiveReservationKey]?.hasAnalysis));
  }, [effectiveReservationKey, selectedBundle, careBundles]);

  const persistDraft = (next: Partial<{ memo: string; prescriptionPhoto: SelectedPhoto | null }>) => {
    setDrafts((current) => ({
      ...current,
      [effectiveReservationKey]: {
        memo,
        prescriptionPhoto,
        ...next,
      },
    }));
  };

  const persistBundle = (next: Partial<CareBundle>) => {
    const merged: CareBundle = {
      ...selectedBundle,
      ...next,
      updatedAtLabel: formatReservationStamp(new Date()),
    };
    onBundleChange(effectiveReservationKey, merged);
  };

  const handlePickPrescription = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('사진 권한 필요', '처방전 사진을 불러오려면 앨범 접근 권한이 필요합니다.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        base64: true,
        allowsEditing: false,
      });

      if (result.canceled || !Array.isArray(result.assets) || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      persistDraft({
        prescriptionPhoto: {
          uri: asset.uri,
          base64: asset.base64 ?? '',
          mimeType: asset.mimeType ?? 'image/jpeg',
        },
      });
    } catch (error) {
      console.warn('[PrescriptionPicker]', error);
      Alert.alert('사진 선택 실패', '처방전 사진을 불러오지 못했습니다.');
    }
  };

  const handleCareDiagnose = async () => {
    if (!hasPrescription && !memo.trim()) {
      Alert.alert('입력 필요', '처방전 사진을 올리거나 의사 소견을 입력해주세요.');
      return;
    }

    Keyboard.dismiss();
    setAnalysisLoading(true);

    try {
      const result = await postJson<FillBagAnalysisResponse>('/api/fillbag/analyze', {
        doctorNote: memo,
        imageBase64: prescriptionPhoto?.base64 ?? null,
        imageMimeType: prescriptionPhoto?.mimeType ?? null,
      });
      persistBundle({
        hasAnalysis: true,
        doctorNote: memo.trim(),
        recommendedHabits: result.recommendedHabits,
        avoidFoods: result.avoidFoods,
        criticalWarning: result.criticalWarning,
        aiSummary: result.aiSummary,
        mealTiming,
        doseFrequency,
        medPushOn,
        feedbackPushOn,
        revisitPushOn,
      });
      setAnalysisReady(true);
      Alert.alert('분석 완료', '진료 후 관리 요약을 업데이트했습니다.');
    } catch (error) {
      console.warn('[FillBagAnalyze]', error);
      Alert.alert('분석 실패', '처방전 또는 상담 내용을 바탕으로 AI 분석을 완료하지 못했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setAnalysisLoading(false);
    }
  };

  return (
    <>
      <View style={styles.segment}>
        <TouchableOpacity
          style={[styles.segmentItem, mode === 'care' && styles.segmentActive]}
          onPress={() => setMode('care')}
        >
          <Text style={[styles.segmentText, mode === 'care' && styles.segmentActiveText]}>상담 및 처방전</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentItem, mode === 'meds' && styles.segmentActive]}
          onPress={() => setMode('meds')}
        >
          <Text style={[styles.segmentText, mode === 'meds' && styles.segmentActiveText]}>약 관리</Text>
        </TouchableOpacity>
      </View>

      {mode === 'care' ? (
        <>
          {reservations.length === 0 ? (
            <View style={styles.fillBagEmptyCard}>
              <Text style={styles.fillBagEmptyIcon}>◎</Text>
              <Text style={styles.fillBagEmptyTitle}>현재 다녀온 병원 기록이 없어요</Text>
              <Text style={styles.fillBagEmptyDescription}>
                Home 또는 Hospital에서 예약한 병원이 생기면{'\n'}이곳에 병원별 관리 카드가 자동으로 만들어집니다.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.whiteCard}>
                <View style={styles.resultHeader}>
                  <View style={styles.row}>
                    <Text style={styles.pin}>◎</Text>
                    <Text style={styles.sectionTitleSmall}>진료 병원별 관리 세트</Text>
                  </View>
                </View>
                <Text style={styles.fillBagBundleGuide}>예약된 병원 카드를 누르면 병원별 사후관리 세트가 카드 안에서 펼쳐져요.</Text>
              </View>

              {reservations.map((item) => {
                const reservationKey = reservationCareKey(item);
                const bundle = careBundles[reservationKey] ?? defaultCareBundle();
                const expanded = expandedReservationId === item.id;
                const draft = drafts[reservationKey] ?? { memo: '', prescriptionPhoto: null };
                const ready = expanded ? analysisReady || Boolean(careBundles[effectiveReservationKey]?.hasAnalysis) : bundle.hasAnalysis;
                const currentMealTiming = expanded ? mealTiming : bundle.mealTiming;
                const currentDoseFrequency = expanded ? doseFrequency : bundle.doseFrequency;
                const currentMedPush = expanded ? medPushOn : bundle.medPushOn;
                const currentFeedbackPush = expanded ? feedbackPushOn : bundle.feedbackPushOn;
                const currentRevisitPush = expanded ? revisitPushOn : bundle.revisitPushOn;

                return (
                  <View key={item.id} style={styles.fillBagReservationCard}>
                    <View style={styles.fillBagReservationHeader}>
                      <TouchableOpacity
                        activeOpacity={0.92}
                        style={styles.fillBagReservationPressable}
                        onPress={() => setExpandedReservationId((current) => (current === item.id ? null : item.id))}
                      >
                        <View style={styles.fillBagReservationHeaderText}>
                          <View style={styles.row}>
                            <View style={[styles.profileReservationBadge, item.source === 'hospital' && styles.profileReservationBadgeMuted]}>
                              <Text
                                style={[
                                  styles.profileReservationBadgeText,
                                  item.source === 'hospital' && styles.profileReservationBadgeTextMuted,
                                ]}
                              >
                                {item.badge}
                              </Text>
                            </View>
                            <View style={styles.fillBagReservationTitleWrap}>
                              <Text style={styles.fillBagReservationTitle}>{item.name}</Text>
                              <Text style={styles.fillBagReservationMeta}>
                                {item.reservedAtLabel}
                                {item.hours ? ` · ${item.hours}` : ''}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.fillBagReservationStatus}>
                            {bundle.hasAnalysis ? `${bundle.updatedAtLabel} 업데이트` : '탭해서 병원별 사후관리 세트를 시작하세요'}
                          </Text>
                        </View>
                        <Text style={styles.fillBagReservationArrow}>{expanded ? '⌃' : '⌄'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.fillBagDeleteButton}
                        onPress={() =>
                          Alert.alert('병원 카드 삭제', `${item.name} 카드를 삭제할까요? 저장된 사후관리 세트도 함께 삭제됩니다.`, [
                            { text: '취소', style: 'cancel' },
                            {
                              text: '삭제',
                              style: 'destructive',
                              onPress: () => {
                                if (expandedReservationId === item.id) {
                                  const remaining = reservations.filter((reservation) => reservation.id !== item.id);
                                  setExpandedReservationId(remaining[0]?.id ?? null);
                                }
                                onDeleteReservation(item);
                              },
                            },
                          ])
                        }
                      >
                        <Text style={styles.fillBagDeleteButtonText}>삭제</Text>
                      </TouchableOpacity>
                    </View>

                    {expanded && (
                      <View style={styles.fillBagExpandedContent}>
                        <View style={styles.diagnosisCard}>
                          <View style={styles.hero}>
                            <Text style={styles.heroSmall}>사후 관리</Text>
                            <Text style={styles.heroTitleSmall}>{`${item.name} 진료 후 관리를 시작해요`}</Text>
                          </View>
                          <View style={styles.cardBody}>
                            <Label
                              text="처방전 사진 업로드"
  customIcon={
    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginRight: 6 }}>
      <Path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" stroke="#aaa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <Circle cx="12" cy="13" r="3" stroke="#aaa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <Line x1="12" y1="11" x2="12" y2="9" stroke="#aaa" strokeWidth="1.8" strokeLinecap="round"/>
      <Line x1="11" y1="10" x2="13" y2="10" stroke="#aaa" strokeWidth="1.8" strokeLinecap="round"/>
    </Svg>
  }
/>
                            <TouchableOpacity style={[styles.uploadBox, styles.uploadBoxSmall]} onPress={handlePickPrescription}>
                              <View style={styles.uploadIconWrap}>
                                {draft.prescriptionPhoto?.uri ? (
                                  <Image source={{ uri: draft.prescriptionPhoto.uri }} style={styles.uploadPreview} />
                                ) : (
                                  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
  <Path
    d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
    stroke="#5DCAA5"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
  <Polyline
    points="14 2 14 8 20 8"
    stroke="#5DCAA5"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
  <Line x1="16" y1="13" x2="8" y2="13" stroke="#5DCAA5" strokeWidth="1.8" strokeLinecap="round"/>
  <Line x1="16" y1="17" x2="8" y2="17" stroke="#5DCAA5" strokeWidth="1.8" strokeLinecap="round"/>
  <Line x1="10" y1="9" x2="8" y2="9" stroke="#5DCAA5" strokeWidth="1.8" strokeLinecap="round"/>
</Svg>
                                )}
                              </View>
                              <Text style={styles.uploadText}>{draft.prescriptionPhoto ? '사진 선택됨' : '사진 업로드'}</Text>
                            </TouchableOpacity>
                            <Label
                              text="의사 소견 입력"
                              customIcon={
                                <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginRight: 6 }}>
                                  <Path d="M12 20h9" stroke="#5DCAA5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                  <Path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" stroke="#5DCAA5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                </Svg>
                              }
                            />
                            <TextInput
                              multiline
                              value={draft.memo}
                              onChangeText={(value) => {
                                persistDraft({ memo: value });
                                persistBundle({ doctorNote: value });
                              }}
                              placeholder="병명과 의사의 소견을 작성해주세요."
                              placeholderTextColor="#A9BFB7"
                              style={[styles.textArea, styles.textAreaSmall]}
                            />
                            <TouchableOpacity style={styles.primaryButton} onPress={handleCareDiagnose}>
                              <Text style={styles.primaryButtonText}>{analysisLoading ? '분석 중...' : '분석 시작'}</Text>
                            </TouchableOpacity>
                            <Text style={styles.disclaimer}>본 결과는 참고용이며 정확한 진단은 의사에게 문의하세요.</Text>
                          </View>
                        </View>

                        <View style={styles.fillBagBundleSectionCard}>
                          <View style={styles.row}>
                            <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <Path
              d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
              stroke="#5DCAA5"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
                            <Text style={styles.sectionTitleSmall}>생활 습관 및 주의사항</Text>
                          </View>
                          <View style={styles.stackCardColumn}>
                            <View style={styles.medsGoodBoxTight}>
                              <Text style={styles.habitGoodTitle}>추천 생활습관</Text>
                              <Text style={styles.habitTextSingle}>
                                {ready ? bundle.recommendedHabits.join(', ') : '상담 내용이나 처방전 분석 후 여기에 반영됩니다.'}
                              </Text>
                            </View>
                            <View style={styles.medsBadBoxTight}>
                              <Text style={styles.habitBadTitle}>주의해야 할 음식</Text>
                              <Text style={styles.habitTextSingle}>
                                {ready ? bundle.avoidFoods.join(', ') : '분석 전에는 주의 음식 정보가 표시되지 않습니다.'}
                              </Text>
                            </View>
                            <View style={styles.medsCriticalBoxTight}>
                              <Text style={styles.medsCriticalTitle}>CRITICAL WARNING</Text>
                              <Text style={styles.habitTextSingle}>
                                {ready ? bundle.criticalWarning : '분석 시작 후 중요한 복약 경고가 있으면 이곳에 표시됩니다.'}
                              </Text>
                            </View>
                          </View>
                        </View>

                        <View style={styles.fillBagBundleSectionCard}>
                          <View style={styles.resultHeader}>
                            <View style={styles.row}>
                              <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"
                    stroke="#5DCAA5"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M20 3v4M22 5h-4"
                    stroke="#5DCAA5"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </Svg>
                              <Text style={styles.sectionTitleSmall}>AI 부작용 감지 요약</Text>
                            </View>
                            <View style={styles.smallPill}>
                              <Text style={styles.pillText}>참고용</Text>
                            </View>
                          </View>
                          <View style={styles.summaryBox}>
                            <Text style={styles.summaryText}>
                              {ready ? bundle.aiSummary : '처방전과 의사 소견을 입력하면 부작용 위험 요약을 보여드려요.'}
                            </Text>
                          </View>
                          <Text style={styles.disclaimer}>
                            본 정보는 참고용이며 정확한 진단은 전문의와 상담하세요.{'\n'}(의료법 제27조 준수)
                          </Text>
                        </View>

                        <View style={styles.fillBagBundleSectionCard}>
                          <View style={styles.row}>
                            <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
  <Path
    d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
    stroke="#5CCAA2"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
  <Path
    d="M13.73 21a2 2 0 0 1-3.46 0"
    stroke="#5CCAA2"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
</Svg>
                            <Text style={styles.sectionTitleSmall}>복약 알림 설정</Text>
                          </View>
                          <Text style={styles.mutedTitle}>약 복용 주기 설정</Text>
                          <View style={styles.optionRow}>
                            {(['식전', '식후', '관계없음'] as const).map((value) => {
                              const active = currentMealTiming === value;
                              return (
                                <TouchableOpacity
                                  key={value}
                                  style={active ? styles.optionActive : styles.option}
                                  onPress={() => {
                                    setMealTiming(value);
                                    persistBundle({ mealTiming: value });
                                  }}
                                >
                                  <Text style={active ? styles.optionActiveText : styles.optionText}>{value}</Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                          <View style={styles.optionRow}>
                            {(['1일 3회', '1일 2회', '수기 입력'] as const).map((value) => {
                              const active = currentDoseFrequency === value;
                              return (
                                <TouchableOpacity
                                  key={value}
                                  style={active ? styles.optionActive : styles.option}
                                  onPress={() => {
                                    setDoseFrequency(value);
                                    persistBundle({ doseFrequency: value });
                                  }}
                                >
                                  <Text style={active ? styles.optionActiveText : styles.optionText}>{value}</Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                          <Text style={styles.mutedTitle}>푸시 알림 설정</Text>
                          <ToggleRow
                            title="약 먹을 시간 푸시 알림"
                            desc="설정한 시간에 알림을 보내드려요"
                            value={currentMedPush}
                            onChange={(value) => {
                              setMedPushOn(value);
                              persistBundle({ medPushOn: value });
                            }}
                          />
                          <ToggleRow
                            title="피드백 루프 푸시 알림"
                            desc="열 내렸나요? 발진 생겼나요?"
                            value={currentFeedbackPush}
                            onChange={(value) => {
                              setFeedbackPushOn(value);
                              persistBundle({ feedbackPushOn: value });
                            }}
                          />
                          <ToggleRow
                            title="병원 재방문 추천 푸시 알림"
                            desc="증상 지속 시 병원 재방문 안내"
                            value={currentRevisitPush}
                            onChange={(value) => {
                              setRevisitPushOn(value);
                              persistBundle({ revisitPushOn: value });
                            }}
                          />
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </>
          )}
        </>
      ) : (
        <View style={styles.whiteCard}>
          <View style={styles.row}>
            <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <Path
            d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
            stroke="#5DCAA5"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M13.73 21a2 2 0 0 1-3.46 0"
            stroke="#5DCAA5"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
            <Text style={styles.sectionTitleSmall}>  약 관리</Text>
          </View>
          <Text style={styles.mutedTitle}>등록한 약과 복용 일정을 한눈에 관리할 수 있어요.</Text>
          <ToggleRow title="아침 복용 알림" desc="오전 8시에 복용 알림" on />
          <ToggleRow title="저녁 복용 알림" desc="오후 8시에 복용 알림" on />
          <ToggleRow title="부작용 체크 알림" desc="복용 후 몸 상태 확인" />
        </View>
      )}
    </>
  );
}

function ProfileScreen3() {
  const [showSymptoms, setShowSymptoms] = useState(true);
  const [showReservations, setShowReservations] = useState(true);

  const symptomItems = [
    { title: '두통', detail: '2026.05.14 · 2주 · 경과 관찰' },
    { title: '목감기', detail: '2026.05.10 · 1주 · 완화' },
    { title: '손목 통증', detail: '2026.05.02 · 2주 · 치료' },
  ];

  const reservations = [
    { name: '가천의료센터', detail: '2026.05.15 · 예약 완료 · 09:00' },
    { name: '서울성모센터', detail: '2026.05.18 · 예약 예정 · 14:30' },
  ];

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={styles.whiteCard}>
        <View style={styles.profileHeaderRow}>
          <Text style={styles.sectionTitle}>지난 증상 기록</Text>
          <TouchableOpacity
            style={styles.profileToggleButton}
            hitSlop={12}
            onPress={() => setShowSymptoms((value) => !value)}
          >
            <Text style={styles.profileToggleButtonText}>{showSymptoms ? '접기' : '전체보기'}</Text>
          </TouchableOpacity>
        </View>
        {showSymptoms && (
          <View style={styles.profileHistoryList}>
            {symptomItems.map((item) => (
              <View key={item.title} style={styles.profileHistoryItem}>
                <Text style={styles.profileHistoryTitle}>{item.title}</Text>
                <Text style={styles.profileHistoryDetail}>{item.detail}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.whiteCard}>
        <View style={styles.profileHeaderRow}>
          <Text style={styles.sectionTitle}>최근 병원 예약</Text>
          <TouchableOpacity
            style={styles.profileToggleButton}
            hitSlop={12}
            onPress={() => setShowReservations((value) => !value)}
          >
            <Text style={styles.profileToggleButtonText}>{showReservations ? '접기' : '전체보기'}</Text>
          </TouchableOpacity>
        </View>
        {showReservations && (
          <View style={styles.profileHistoryList}>
            {reservations.map((item) => (
              <View key={item.name} style={styles.profileHistoryItem}>
                <Text style={styles.profileHistoryTitle}>{item.name}</Text>
                <Text style={styles.profileHistoryDetail}>{item.detail}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function ProfileScreen4({
  careBundles,
  reservations,
  symptomHistory,
  onLogout,
}: {
  careBundles: Record<string, CareBundle>;
  reservations: ReservationHistoryItem[];
  symptomHistory: SymptomHistoryItem[];
  onLogout: () => void;
}) {
  const [showAllSymptoms, setShowAllSymptoms] = useState(false);
  const [selectedSymptom, setSelectedSymptom] = useState<SymptomHistoryItem | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<ReservationHistoryItem | null>(null);
  const [showPrescriptionInfo, setShowPrescriptionInfo] = useState<ReservationHistoryItem | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [expandedReservationId, setExpandedReservationId] = useState<string | null>(null);
  const fallbackSymptoms = [
  { id: 'fallback-1', dateLabel: '오늘', title: '두통 및 발열', detail: 'AI 추정: 감기 · 78%', source: 'home' as const },
  { id: 'fallback-2', dateLabel: '05.20', title: '소화 불량', detail: 'AI 추정: 위염 · 66%', source: 'hospital' as const },
  { id: 'fallback-3', dateLabel: '05.15', title: '심한 근육통', detail: 'AI 추정: 몸살 · 72%', source: 'home' as const },
  { id: 'fallback-4', dateLabel: '05.10', title: '기침 및 콧물', detail: 'AI 추정: 감기 · 81%', source: 'home' as const },
  { id: 'fallback-5', dateLabel: '05.05', title: '복통', detail: 'AI 추정: 위장염 · 69%', source: 'hospital' as const },
];
  const symptomItems = symptomHistory.length > 0 ? symptomHistory : fallbackSymptoms;
  const visibleSymptoms = showAllSymptoms ? symptomItems : symptomItems.slice(0, 2);
  const latestCareBundle =
    reservations
      .map((item) => careBundles[reservationCareKey(item)] ?? null)
      .find((bundle) => bundle?.hasAnalysis) ?? null;
  const profileHabits = latestCareBundle?.recommendedHabits ?? ['충분한 수면', '실내 습도 50% 유지', '수분 섭취 1.5L 이상'];
  const profileFoods = latestCareBundle?.avoidFoods ?? ['자극적인 음식', '카페인', '음주 절대 금지'];
  const profileWarning =
    latestCareBundle?.criticalWarning ?? '아세트아미노펜 복용 중 음주는 간 손상의 치명적인 원인이 될 수 있습니다.';

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={styles.profileHeroCard}>
        <View style={styles.profileHeroTop}>
          <View style={styles.profileAvatar}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                    stroke="rgba(255,255,255,0.8)"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Circle
                    cx="12"
                    cy="7"
                    r="4"
                    stroke="rgba(255,255,255,0.8)"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
          </View>
          <View style={styles.profileHeroTextGroup}>
            <Text style={styles.profileHeroName} numberOfLines={1}>김철수 님</Text>
            <Text style={styles.profileHeroSub}>425일째 관리 중</Text>
          </View>
          <View style={styles.profileHeroChip}>
            <Text style={styles.profileHeroChipText}>A형 / 만 32세</Text>
          </View>
        </View>
        <View style={styles.profileMetaGrid}>
          <View style={styles.profileMetaBox}>
            <Text style={styles.profileMetaLabel}>기저 질환</Text>
            <Text style={styles.profileMetaValue}>고혈압(초기)</Text>
          </View>
          <View style={styles.profileMetaBox}>
            <Text style={styles.profileMetaLabel}>알레르기</Text>
            <Text style={styles.profileMetaValue}>비염, 갑각류</Text>
          </View>
        </View>
      </View>

      <View style={styles.whiteCard}>
        <View style={styles.profileSectionHeader}>
          <View style={styles.row}>
            <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <Path
              d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
              stroke="#5DCAA5"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
            <Text style={styles.sectionTitleSmall}>  생활 습관 및 주의사항</Text>
          </View>
        </View>
        <View style={styles.stackCardColumn}>
          <View style={styles.medsGoodBoxTight}>
            <Text style={styles.medsGoodTitle}>추천 생활습관</Text>
            <Text style={styles.medsGoodText}>{profileHabits.join(', ')}</Text>
          </View>
          <View style={styles.medsBadBoxTight}>
            <Text style={styles.medsBadTitle}>주의해야 할 음식</Text>
            <Text style={styles.medsBadText}>{profileFoods.join(', ')}</Text>
          </View>
          <View style={styles.medsCriticalBoxTight}>
            <Text style={styles.medsCriticalTitle}>CRITICAL WARNING</Text>
            <Text style={styles.medsCriticalText}>{profileWarning}</Text>
          </View>
        </View>
      </View>

        <View style={styles.whiteCard}>
  <TouchableOpacity style={styles.profileSectionHeader} onPress={() => setShowAllSymptoms((value) => !value)}>
    <View style={styles.row}>
      <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <Circle
          cx="12"
          cy="12"
          r="10"
          stroke="#5DCAA5"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Polyline
          points="12 6 12 12 16 14"
          stroke="#5DCAA5"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <Text style={styles.sectionTitleSmall}>  지난 증상 기록</Text>
    </View>
  </TouchableOpacity>
        <View style={styles.profileHistoryList}>
          {visibleSymptoms.map((item) => (
            <TouchableOpacity key={item.id} style={styles.profileHistoryRow} onPress={() => setSelectedSymptom(item)}>
              <View>
                <Text style={styles.profileHistoryDate}>{item.dateLabel}</Text>
                <Text style={styles.profileHistoryTitle}>{item.title}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.whiteCard}>
        <View style={styles.profileSectionHeader}>
          <View style={styles.row}>
            <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <Rect
                x="3"
                y="4"
                width="18"
                height="18"
                rx="2"
                stroke="#5DCAA5"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Line
                x1="16"
                y1="2"
                x2="16"
                y2="6"
                stroke="#5DCAA5"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <Line
                x1="8"
                y1="2"
                x2="8"
                y2="6"
                stroke="#5DCAA5"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <Line
                x1="3"
                y1="10"
                x2="21"
                y2="10"
                stroke="#5DCAA5"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </Svg>
            <Text style={styles.sectionTitleSmall}>  최근 병원 예약</Text>
          </View>
        </View>
        <View style={styles.profileReservationStack}>
          {reservations.length === 0 ? (
            <View style={styles.profileReservationEmpty}>
              <Text style={styles.profileReservationEmptyText}>홈 또는 병원 페이지에서 예약한 병원이 여기에 표시됩니다.</Text>
            </View>
          ) : (
            reservations.map((item) => (
              <View key={item.id} style={styles.profileReservationCard}>
                {(() => {
                  const bundle = careBundles[reservationCareKey(item)] ?? defaultCareBundle();
                  const expanded = expandedReservationId === item.id;
                  return (
                    <>
                      <TouchableOpacity
                        style={styles.profileReservationBundlePreview}
                        activeOpacity={0.9}
                        onPress={() => setExpandedReservationId((current) => (current === item.id ? null : item.id))}
                      >
                        <View style={styles.profileReservationBundlePreviewTop}>
                          <Text style={styles.profileReservationBundleTitle}>사후관리 세트</Text>
                          <Text style={styles.profileReservationBundleToggle}>{expanded ? '접기' : '펼치기'}</Text>
                        </View>
                        <Text style={styles.profileReservationBundleText} numberOfLines={expanded ? 10 : 2}>
                          {bundle.hasAnalysis ? bundle.recommendedHabits.join(', ') : '아직 분석 전이에요. Fill Bag에서 이 병원의 사후관리를 시작해보세요.'}
                        </Text>
                        <Text style={styles.profileReservationBundleMeta}>
                          {bundle.hasAnalysis ? `${bundle.mealTiming} · ${bundle.doseFrequency}` : '사후관리 세트 준비 전'}
                        </Text>
                      </TouchableOpacity>
                      {expanded && (
                        <View style={styles.profileReservationBundleExpanded}>
                          <View style={styles.profileReservationExpandedBlock}>
                            <Text style={styles.profileReservationExpandedTitle}>추천 생활습관</Text>
                            <Text style={styles.profileReservationExpandedText}>
                              {bundle.hasAnalysis ? bundle.recommendedHabits.join(', ') : '아직 추천 생활습관이 생성되지 않았어요.'}
                            </Text>
                          </View>
                          <View style={[styles.profileReservationExpandedBlock, styles.profileReservationExpandedWarnBlock]}>
                            <Text style={styles.profileReservationExpandedWarnTitle}>주의해야 할 음식</Text>
                            <Text style={styles.profileReservationExpandedText}>
                              {bundle.hasAnalysis ? bundle.avoidFoods.join(', ') : '아직 주의 음식 정보가 없어요.'}
                            </Text>
                          </View>
                          <View style={styles.profileReservationExpandedCritical}>
                            <Text style={styles.profileReservationExpandedCriticalTitle}>CRITICAL WARNING</Text>
                            <Text style={styles.profileReservationExpandedCriticalText}>
                              {bundle.hasAnalysis ? bundle.criticalWarning : '분석이 완료되면 중요한 복약 경고가 여기에 표시됩니다.'}
                            </Text>
                          </View>
                          <View style={styles.profileReservationExpandedSummary}>
                            <Text style={styles.profileReservationExpandedSummaryTitle}>AI 부작용 감지 요약</Text>
                            <Text style={styles.profileReservationExpandedSummaryText}>
                              {bundle.hasAnalysis ? bundle.aiSummary : '처방전과 의사 소견을 분석하면 AI 요약이 여기에 표시됩니다.'}
                            </Text>
                          </View>
                          <View style={styles.profileReservationExpandedSettings}>
                            <Text style={styles.profileReservationExpandedSettingsTitle}>복약 알림 설정</Text>
                            <Text style={styles.profileReservationExpandedSettingsText}>
                              {bundle.mealTiming} · {bundle.doseFrequency}
                            </Text>
                            <Text style={styles.profileReservationExpandedSettingsSub}>
                              시간 알림 {bundle.medPushOn ? 'ON' : 'OFF'} · 피드백 {bundle.feedbackPushOn ? 'ON' : 'OFF'} · 재방문 {bundle.revisitPushOn ? 'ON' : 'OFF'}
                            </Text>
                          </View>
                        </View>
                      )}
                    </>
                  );
                })()}
                <View style={styles.profileReservationCardHeader}>
                  <View style={[styles.profileReservationBadge, item.source === 'hospital' && styles.profileReservationBadgeMuted]}>
                    <Text style={[styles.profileReservationBadgeText, item.source === 'hospital' && styles.profileReservationBadgeTextMuted]}>
                      {item.badge}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedReservation(item)}>
                  </TouchableOpacity>
                </View>
                <Text style={styles.profileReservationName}>{item.name}</Text>
                <Text style={styles.profileReservationDetail}>{item.reservedAtLabel}{item.hours ? ` · ${item.hours}` : ''}</Text>
                <View style={styles.profileReservationActionRow}>
                  <TouchableOpacity style={styles.profileReservationPrimary} onPress={() => setSelectedReservation(item)}>
                    <Text style={styles.profileReservationPrimaryText}>상담 내역</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.profileReservationSecondary} onPress={() => setShowPrescriptionInfo(item)}>
                    <Text style={styles.profileReservationSecondaryText}>처방전</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </View>

      <View style={styles.profileMenuCard}>
        <TouchableOpacity style={styles.profileMenuRow} onPress={() => setShowSettings(true)}>
          <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <Circle
                cx="12"
                cy="12"
                r="3"
                stroke="#555"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
                stroke="#555"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          <Text style={styles.profileMenuText}>  설정 및 계정 관리</Text>
        </TouchableOpacity>
        <View style={styles.profileMenuDivider} />
        <TouchableOpacity style={styles.profileMenuRow} onPress={onLogout}>
          <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <Path
                d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
                stroke="#E53935"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Polyline
                points="16 17 21 12 16 7"
                stroke="#E53935"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Line
                x1="21"
                y1="12"
                x2="9"
                y2="12"
                stroke="#E53935"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </Svg>
          <Text style={styles.profileMenuLogoutText}>  로그아웃</Text>
        </TouchableOpacity>
      </View>

      <Modal transparent visible={Boolean(selectedSymptom)} animationType="fade" onRequestClose={() => setSelectedSymptom(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.profileDetailSheet}>
            <Text style={styles.profileDetailTitle}>증상 기록</Text>
            <Text style={styles.profileDetailHeading}>{selectedSymptom?.title}</Text>
            <Text style={styles.profileDetailBody}>{selectedSymptom?.dateLabel} · {selectedSymptom?.detail}</Text>
            <TouchableOpacity style={styles.profileDetailButton} onPress={() => setSelectedSymptom(null)}>
              <Text style={styles.profileDetailButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={Boolean(selectedReservation)} animationType="fade" onRequestClose={() => setSelectedReservation(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.profileDetailSheet}>
            <Text style={styles.profileDetailTitle}>상담 내역</Text>
            <Text style={styles.profileDetailHeading}>{selectedReservation?.name}</Text>
            {(() => {
              const bundle = selectedReservation ? careBundles[reservationCareKey(selectedReservation)] ?? null : null;
              const doctorNote = bundle?.doctorNote?.trim();
              return (
                <Text style={styles.profileDetailBody}>
                  {selectedReservation?.address}{'\n'}
                  {selectedReservation?.reservedAtLabel}{selectedReservation?.hours ? ` · ${selectedReservation.hours}` : ''}{'\n'}
                  {selectedReservation?.phone}
                  {'\n\n'}의사 소견{'\n'}
                  {doctorNote && doctorNote.length > 0 ? doctorNote : '아직 입력된 상담/의사 소견이 없습니다.'}
                </Text>
              );
            })()}
            <TouchableOpacity style={styles.profileDetailButton} onPress={() => setSelectedReservation(null)}>
              <Text style={styles.profileDetailButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={Boolean(showPrescriptionInfo)} animationType="fade" onRequestClose={() => setShowPrescriptionInfo(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.profileDetailSheet}>
            <Text style={styles.profileDetailTitle}>처방전 요약</Text>
            <Text style={styles.profileDetailHeading}>{showPrescriptionInfo?.name}</Text>
            {(() => {
              const bundle = showPrescriptionInfo ? careBundles[reservationCareKey(showPrescriptionInfo)] ?? null : null;
              const habits = bundle?.recommendedHabits ?? profileHabits;
              const foods = bundle?.avoidFoods ?? profileFoods;
              const warning = bundle?.criticalWarning ?? profileWarning;
              const medInfo = bundle ? `${bundle.mealTiming} · ${bundle.doseFrequency}` : '기본 복약 정보';
              return (
                <Text style={styles.profileDetailBody}>
                  추천 생활습관: {habits.join(', ')}{'\n\n'}
                  주의 음식: {foods.join(', ')}{'\n\n'}
                  복약 설정: {medInfo}{'\n\n'}
                  {warning}
                </Text>
              );
            })()}
            <TouchableOpacity style={styles.profileDetailButton} onPress={() => setShowPrescriptionInfo(null)}>
              <Text style={styles.profileDetailButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={showSettings} animationType="fade" onRequestClose={() => setShowSettings(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.profileDetailSheet}>
            <Text style={styles.profileDetailTitle}>설정 및 계정 관리</Text>
            <View style={styles.profileSettingsStack}>
              <ToggleRow title="알림 받기" desc="병원 예약, 복약, 분석 결과 알림" on />
              <ToggleRow title="위치 사용" desc="주변 병원 추천을 위해 현재 위치 사용" on />
            </View>
            <TouchableOpacity style={styles.profileDetailButton} onPress={() => setShowSettings(false)}>
              <Text style={styles.profileDetailButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function ToggleRow({
  title,
  desc,
  on,
  value,
  onChange,
}: {
  title: string;
  desc: string;
  on?: boolean;
  value?: boolean;
  onChange?: (next: boolean) => void;
}) {
  const [internalEnabled, setInternalEnabled] = useState(on ?? false);
  const enabled = value ?? internalEnabled;

  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleTextBlock}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleDesc}>{desc}</Text>
      </View>
      <TouchableOpacity
        style={[styles.toggle, enabled && styles.toggleOn]}
        onPress={() => {
          const next = !enabled;
          if (value === undefined) {
            setInternalEnabled(next);
          }
          onChange?.(next);
          if (!onChange) {
            Alert.alert('알림 설정', `${title} 설정이 변경되었습니다.`);
          }
        }}
      >
        <View style={[styles.knob, enabled && styles.knobOn]} />
      </TouchableOpacity>
    </View>
  );
}

function BottomNav({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  const items: { id: Tab; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'hospital', label: 'Hospital' },
    { id: 'fillbag', label: 'Fill Bag' },
    { id: 'profile', label: 'Profile' },
  ];

  const renderIcon = (id: Tab, color: string) => {
    if (id === 'home') return (
      <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <Path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M9 21V12h6v9" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    );
    if (id === 'hospital') return (
      <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <Rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M12 8v8M8 12h8" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    );
    if (id === 'fillbag') return (
      <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <Path d="M9 3h6l1 4H8L9 3z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <Rect x="4" y="7" width="16" height="14" rx="2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M12 11v6M9 14h6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    );
    return (
      <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    );
  };

  return (
    <View style={styles.nav}>
      {items.map((item) => {
        const isActive = active === item.id;
        const color = isActive ? mint : '#A9C5BC';
        return (
          <TouchableOpacity key={item.id} style={styles.navItem} onPress={() => onChange(item.id)}>
            {renderIcon(item.id, color)}
            <Text style={[styles.navLabel, isActive && styles.navActive]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  app: {
    flex: 1,
    backgroundColor: bg,
    overflow: 'hidden',
  },
  scaler: {
    flex: 1,
    width: '100%',
    backgroundColor: bg,
  },
  header: {
    height: 78,
    position: 'relative',
    backgroundColor: bg,
  },
  headerCompact: {
    height: 96,
  },
  time: { position: 'absolute', left: 28, top: 14, fontSize: 14, fontWeight: '700', color: '#111' },
  timeSmall: { fontSize: 14 },
  logo: { position: 'absolute', left: 24, top: 44, fontSize: 18, fontWeight: '700', color: '#030706' },
  logoSmall: { fontSize: 18 },
  signal: { position: 'absolute', right: 34, top: 15, fontSize: 12, color: '#111' },
  bell: {
    position: 'absolute',
    right: 38,
    top: 42,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellIcon: { color: mint, fontSize: 22, fontWeight: '700' },
  bellGlyph: {
    width: 18,
    height: 18,
    position: 'relative',
  },
  bellHandle: {
    position: 'absolute',
    left: 7.2,
    top: 1,
    width: 3.6,
    height: 2.4,
    borderWidth: 1.6,
    borderColor: mint,
    borderBottomWidth: 0,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    backgroundColor: 'transparent',
  },
  bellDome: {
    position: 'absolute',
    left: 4,
    top: 3,
    width: 10,
    height: 8.2,
    borderWidth: 1.6,
    borderColor: mint,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    backgroundColor: 'transparent',
  },
  bellClapper: {
    position: 'absolute',
    left: 7.4,
    bottom: 2,
    width: 2.2,
    height: 2.2,
    borderRadius: 1.1,
    backgroundColor: mint,
  },
  hiddenScreen: { display: 'none' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 128 },
  homeScroll: { paddingBottom: 220 },
  hospitalScroll: { paddingHorizontal: 16, paddingBottom: 112 },
  hospitalPage: { paddingBottom: 10 },
  hospitalDiagnosisRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  hospitalDiagnosisTitle: {
    flex: 1.05,
    minWidth: 0,
    marginRight: 10,
    color: text,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  hospitalInlineTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: '#D8F0E8', overflow: 'hidden' },
  hospitalInlineFill: { width: '85%', height: '100%', borderRadius: 4, backgroundColor: '#1EA37B' },
  hospitalInlinePercent: { marginLeft: 16, color: mintDark, fontSize: 15, fontWeight: '800' },
  hospitalInfoCircle: {
    marginLeft: 11,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: mintDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hospitalInfoText: { color: mintDark, fontSize: 15, fontWeight: '800' },
  hospitalSectionTitle: { marginTop: 16, marginBottom: 12, color: text, fontSize: 18, fontWeight: '800' },
  emergencySectionTitle: { color: '#E56A74', marginTop: 4 },
  fillScroll: { paddingHorizontal: 20, paddingBottom: 148 },
  diagnosisCard: {
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D7EFE6',
    overflow: 'hidden',
    marginBottom: 22,
  },
  hero: { backgroundColor: mint, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 17 },
  heroSmall: { color: '#E8FFF7', fontSize: 13, lineHeight: 17, marginBottom: 4 },
  heroTitle: { color: '#fff', fontSize: 20, lineHeight: 24, fontWeight: '700' },
  heroTitleSmall: { color: '#fff', fontSize: 22, lineHeight: 28, fontWeight: '700' },
  cardBody: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 16 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  labelIcon: { color: sub, fontSize: 14, marginRight: 6 },
  labelText: { color: sub, fontSize: 13, fontWeight: '600' },
  uploadBox: {
    height: 58,
    borderRadius: 11,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#A8E8D2',
    backgroundColor: '#F1FBF7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  uploadBoxSmall: { height: 74 },
  uploadIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#DFF6EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    overflow: 'hidden',
  },
  uploadIcon: { color: mint, fontSize: 17, fontWeight: '800' },
  uploadPreview: { width: 38, height: 38, borderRadius: 11 },
  uploadText: { color: '#247B61', fontSize: 13, fontWeight: '700' },
  photoSelectedHint: { color: mintDark, fontSize: 10, marginBottom: 8, marginTop: -2, paddingLeft: 6 },
  textArea: {
    height: 72,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D7EFE6',
    backgroundColor: '#F2FBF7',
    paddingHorizontal: 16,
    paddingTop: 10,
    color: text,
    fontSize: 12,
    lineHeight: 17,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  textAreaSmall: { height: 106 },
  primaryButton: {
    height: 50,
    borderRadius: 9,
    backgroundColor: mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    marginBottom: 14,
  },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  disclaimer: { color: sub, fontSize: 12, lineHeight: 17, textAlign: 'center' },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#D7EFE6',
    paddingBottom: 14,
    marginBottom: 18,
    overflow: 'hidden',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 10,
  },
  summaryResultHeader: { marginBottom: 0 },
  row: { flexDirection: 'row', alignItems: 'center' },
  chartIcon: { color: mint, fontSize: 18, marginRight: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: text },
  sectionTitleSmall: { fontSize: 16, fontWeight: '800', color: text },
  pill: { backgroundColor: '#AEE7D2', borderRadius: 15, paddingHorizontal: 14, paddingVertical: 5, alignSelf: 'flex-start' },
  smallPill: { backgroundColor: '#AEE7D2', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { color: '#2C8C6E', fontSize: 13, fontWeight: '700' },
  resultMain: {
    borderTopWidth: 1,
    borderTopColor: line,
    paddingHorizontal: 26,
    paddingTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  resultMainLeft: { flex: 1, minWidth: 0 },
  diseaseTitle: { fontSize: 20, color: text, fontWeight: '800', marginBottom: 4 },
  diseaseSub: { color: sub, fontSize: 12 },
  circle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: mint,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  circleText: { color: mintDark, fontSize: 14, fontWeight: '800' },
  progressBlock: { paddingHorizontal: 26, marginTop: 8 },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressLabel: { fontSize: 12, color: text, fontWeight: '600' },
  progressValue: { fontSize: 13, color: mintDark, fontWeight: '800' },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: '#DCF4EC', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5, backgroundColor: '#93DFC5' },
  adviceBox: { marginHorizontal: 26, marginTop: 12, borderRadius: 10, backgroundColor: '#EEF9F5', borderLeftWidth: 3, borderLeftColor: mint, padding: 10 },
  adviceText: { color: '#258365', fontSize: 11, lineHeight: 15, fontWeight: '600' },
  recommendCard: { marginTop: 6 },
  miniHospital: { backgroundColor: '#fff', borderRadius: 22, padding: 22, borderLeftWidth: 4, borderLeftColor: '#A7E4D0', marginBottom: 24 },
  miniHospitalDanger: { borderLeftColor: '#FFB4B9' },
  tag: { alignSelf: 'flex-start', borderRadius: 16, backgroundColor: '#B5EBD8', paddingHorizontal: 18, paddingVertical: 7, marginBottom: 12 },
  tagDanger: { backgroundColor: '#FFE8E9', borderWidth: 1, borderColor: '#FF858B' },
  tagText: { color: '#2C8C6E', fontSize: 14, fontWeight: '700' },
  tagTextDanger: { color: '#F36F77' },
  hospitalName: { fontSize: 22, color: text, fontWeight: '800', marginBottom: 6 },
  hospitalMeta: { color: sub, fontSize: 13, marginBottom: 16 },
  actionRow: { flexDirection: 'row', gap: 24 },
  reserveBtn: { flex: 1, height: 50, borderRadius: 18, backgroundColor: mint, alignItems: 'center', justifyContent: 'center' },
  reserveBtnGhost: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E2E2' },
  reserveText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  reserveTextGhost: { color: '#6A6A6A' },
  navBtn: { flex: 1, height: 50, borderRadius: 18, borderWidth: 1, borderColor: mint, alignItems: 'center', justifyContent: 'center' },
  navBtnDanger: { borderColor: '#FF858B' },
  navText: { color: mint, fontSize: 15, fontWeight: '800' },
  navTextDanger: { color: '#F36F77' },
  bottomNote: { textAlign: 'center', color: sub, fontSize: 15, marginTop: 2 },
  searchBar: { height: 58, borderRadius: 17, backgroundColor: '#fff', borderWidth: 1, borderColor: '#D7EFE6', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, marginBottom: 10 },
  searchIcon: { color: mint, fontSize: 22, marginRight: 8, flexShrink: 0 },
  searchPlaceholder: { flex: 1, color: sub, fontSize: 15 },
  hospitalSearchInput: { flex: 1, minWidth: 0, color: text, fontSize: 14, paddingVertical: 0, marginRight: 8 },
  searchButton: { width: 54, height: 39, borderRadius: 11, backgroundColor: mint, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  searchButtonText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  searchButtonDisabled: { opacity: 0.8 },
  symptomCard: { backgroundColor: '#fff', borderRadius: 22, borderWidth: 1, borderColor: '#D7EFE6', paddingHorizontal: 22, paddingVertical: 15, marginBottom: 20 },
  symptomTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  symptomTitle: { flex: 1, fontSize: 19, color: text, fontWeight: '700' },
  symptomPercent: { fontSize: 20, color: mintDark, fontWeight: '800', marginRight: 20 },
  infoCircle: { width: 34, height: 34, borderRadius: 17, borderWidth: 3, borderColor: mint, alignItems: 'center', justifyContent: 'center' },
  infoText: { color: mint, fontSize: 20, fontWeight: '800' },
  longTrack: { height: 10, borderRadius: 5, backgroundColor: '#DCF4EC', overflow: 'hidden' },
  longFill: { height: '100%', backgroundColor: '#93DFC5', borderRadius: 6 },
  map: { height: 210, borderRadius: 18, backgroundColor: '#F7F8FA', overflow: 'hidden', marginBottom: 0 },
  mapCanvas: { position: 'absolute', left: -4, top: -8, right: -4, bottom: -8, backgroundColor: '#F8F8F8' },
  road: { position: 'absolute', backgroundColor: '#B7C8D2' },
  roadA: { width: 360, height: 28, transform: [{ rotate: '-18deg' }], left: -24, top: 132 },
  roadB: { width: 30, height: 310, transform: [{ rotate: '-16deg' }], left: 74, top: -44 },
  roadC: { width: 330, height: 27, transform: [{ rotate: '34deg' }], left: -72, top: 74 },
  roadD: { width: 32, height: 330, transform: [{ rotate: '-16deg' }], right: 44, top: -78 },
  roadE: { width: 280, height: 18, transform: [{ rotate: '-18deg' }], left: 18, top: 54, opacity: 0.75 },
  roadF: { width: 22, height: 260, transform: [{ rotate: '-16deg' }], left: 142, top: -28, opacity: 0.75 },
  mapBuilding: { position: 'absolute', backgroundColor: '#E7EBF1', borderWidth: 1, borderColor: '#D5DCE6' },
  mapBuildingA: { width: 72, height: 48, left: 18, top: 36, transform: [{ rotate: '-18deg' }] },
  mapBuildingB: { width: 84, height: 60, left: 116, top: 18, transform: [{ rotate: '12deg' }] },
  mapBuildingC: { width: 74, height: 92, right: 18, top: 16, transform: [{ rotate: '14deg' }] },
  mapBuildingD: { width: 98, height: 70, left: 36, bottom: 28, transform: [{ rotate: '12deg' }] },
  mapBuildingE: { width: 88, height: 82, right: 76, bottom: 24, transform: [{ rotate: '-14deg' }] },
  mapBuildingF: { width: 46, height: 28, left: 4, top: 92, transform: [{ rotate: '-18deg' }] },
  mapBuildingG: { width: 44, height: 38, left: 112, top: 88, transform: [{ rotate: '12deg' }] },
  mapBuildingH: { width: 52, height: 36, right: 6, top: 96, transform: [{ rotate: '14deg' }] },
  mapBuildingI: { width: 42, height: 42, left: 154, bottom: 4, transform: [{ rotate: '-14deg' }] },
  mapBuildingJ: { width: 52, height: 30, right: 12, bottom: 6, transform: [{ rotate: '-18deg' }] },
  block: { position: 'absolute', backgroundColor: '#E6EAF0', borderWidth: 1, borderColor: '#D6DDE5' },
  blockA: { width: 70, height: 54, left: 18, top: 22, transform: [{ rotate: '-18deg' }] },
  blockB: { width: 82, height: 66, right: 18, top: 18, transform: [{ rotate: '17deg' }] },
  blockC: { width: 86, height: 70, left: 36, bottom: 22, transform: [{ rotate: '12deg' }] },
  blockD: { width: 72, height: 88, right: 80, bottom: 28, transform: [{ rotate: '-16deg' }] },
  mapTabs: { position: 'absolute', top: 12, left: 14, flexDirection: 'row', gap: 10 },
  mapTabActive: {
    width: 96,
    textAlign: 'center',
    backgroundColor: mint,
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    paddingVertical: 9,
    borderRadius: 18,
  },
  mapTab: {
    width: 88,
    textAlign: 'center',
    backgroundColor: '#fff',
    color: '#267A61',
    fontSize: 13,
    fontWeight: '800',
    paddingVertical: 9,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: line,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  mapMarkerLabel: { position: 'absolute', left: 172, top: 124, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 4, elevation: 3 },
  mapMarkerText: { color: text, fontSize: 13, fontWeight: '800' },
  mapPin: { position: 'absolute', left: 214, top: 92, width: 26, height: 32, borderRadius: 13, borderWidth: 4, borderColor: '#E9323D', alignItems: 'center', justifyContent: 'center' },
  mapPinInner: { width: 13, height: 13, borderRadius: 7, backgroundColor: '#E9757B' },
  mapRoadText: { position: 'absolute', color: '#fff', fontSize: 13, fontWeight: '800', textShadowColor: '#6D8190', textShadowRadius: 2 },
  placeholderMapIcon: {
    position: 'absolute',
    left: '50%',
    top: 82,
    width: 54,
    height: 42,
    marginLeft: -27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderMapEmoji: { fontSize: 28 },
  placeholderPin: {
    position: 'absolute',
    right: 4,
    top: -2,
    width: 22,
    height: 28,
    borderRadius: 11,
    borderWidth: 3,
    borderColor: '#E9323D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderPinDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#E9323D' },
  placeholderMapLabel: {
    position: 'absolute',
    top: 114,
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 4,
    elevation: 3,
  },
  placeholderMapLabelText: { color: text, fontSize: 13, fontWeight: '800' },
  placeholderMapText: {
    position: 'absolute',
    top: 160,
    alignSelf: 'center',
    color: '#217B5F',
    fontSize: 15,
    fontWeight: '700',
  },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginHorizontal: -16, marginTop: -1, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 34, borderTopWidth: 1, borderColor: line },
  handle: { alignSelf: 'center', width: 56, height: 6, borderRadius: 3, backgroundColor: '#C6EADF', marginBottom: 14 },
  pin: { color: mint, fontSize: 22, marginRight: 10 },
  sheetTitle: { fontSize: 19, color: text, fontWeight: '800' },
  hospitalList: { borderRadius: 18, backgroundColor: '#fff', paddingHorizontal: 18, paddingVertical: 15, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 },
  hospitalListCompact: { backgroundColor: '#F0FAF5', marginTop: 16, marginBottom: 0, borderLeftWidth: 3, borderLeftColor: '#A7E4D0', shadowOpacity: 0, elevation: 0 },
  openTag: { alignSelf: 'flex-start', borderRadius: 14, backgroundColor: '#B5EBD8', paddingHorizontal: 14, paddingVertical: 5, marginBottom: 8 },
  openTagText: { color: '#2C8C6E', fontSize: 13, fontWeight: '700' },
  listName: { fontSize: 18, color: text, fontWeight: '800', marginBottom: 6 },
  listMeta: { color: sub, fontSize: 14, marginBottom: 14 },
  listReserve: { flex: 1, height: 44, borderRadius: 16, backgroundColor: mint, alignItems: 'center', justifyContent: 'center' },
  listReserveText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  listMap: { flex: 1, height: 44, borderRadius: 16, borderWidth: 1, borderColor: mint, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  listMapText: { color: mintDark, fontSize: 14, fontWeight: '800' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.32)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 28,
    paddingTop: 18,
    paddingBottom: 82,
  },
  sheetGrabber: { position: 'absolute', left: 0, right: 0, top: 8, height: 24, alignItems: 'center', justifyContent: 'center' },
  sheetGrabberBar: { width: 54, height: 5, borderRadius: 3, backgroundColor: '#CDE9DF' },
  sheetClose: {
    position: 'absolute',
    right: 24,
    top: 48,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F6F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCloseText: { color: '#111', fontSize: 28, lineHeight: 30 },
  sheetHospitalName: { marginTop: 34, marginBottom: 16, color: '#111', fontSize: 22, fontWeight: '800' },
  sheetInfoRow: { flexDirection: 'row', alignItems: 'center', minHeight: 25 },
  sheetInfoIcon: { width: 24, color: mint, fontSize: 17, fontWeight: '800' },
  sheetInfoText: { flex: 1, color: sub, fontSize: 15, lineHeight: 21 },
  sheetRatingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 20 },
  sheetStar: { color: '#F3C522', fontSize: 19, marginRight: 8 },
  sheetRating: { color: mintDark, fontSize: 16, fontWeight: '800' },
  sheetActionRow: { flexDirection: 'row', gap: 12, marginTop: 2 },
  sheetReserveButton: { flex: 1, height: 52, borderRadius: 18, backgroundColor: '#1EA37B', alignItems: 'center', justifyContent: 'center' },
  sheetReserveText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  sheetMapButton: { flex: 1, height: 52, borderRadius: 18, borderWidth: 1, borderColor: '#D8D8D8', alignItems: 'center', justifyContent: 'center' },
  sheetMapText: { color: text, fontSize: 16, fontWeight: '800' },
  notificationOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#EFF7F3',
  },
  notificationSheet: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 18,
  },
  notificationHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  notificationBack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E1ECE7',
  },
  notificationBackText: { color: text, fontSize: 19, lineHeight: 20, fontWeight: '700' },
  notificationTitle: { color: text, fontSize: 17, fontWeight: '800', flex: 1, marginLeft: 12 },
  notificationReadAll: { color: mint, fontSize: 13, fontWeight: '800' },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D7EFE6',
    marginBottom: 14,
    overflow: 'hidden',
  },
  notificationCardDanger: { borderColor: '#F3C2C6' },
  notificationCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#EEF9F4',
  },
  notificationCardTopDanger: { backgroundColor: '#FFF0F1' },
  notificationCardTitle: { color: mintDark, fontSize: 13, fontWeight: '800' },
  notificationCardTitleDanger: { color: '#E16B6B' },
  notificationCardTime: { color: sub, fontSize: 12, fontWeight: '700' },
  notificationCardBody: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 16 },
  notificationCardBodyTitle: { color: text, fontSize: 16, fontWeight: '800', marginBottom: 6 },
  notificationCardBodyText: { color: sub, fontSize: 13, lineHeight: 18, marginBottom: 14 },
  notificationActionRow: { flexDirection: 'row', gap: 10 },
  notificationPrimary: { flex: 1, height: 48, borderRadius: 16, backgroundColor: mint, alignItems: 'center', justifyContent: 'center' },
  notificationPrimaryDanger: { backgroundColor: '#E16B6B' },
  notificationPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  notificationSecondary: { flex: 1, height: 48, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#D8E7E1', alignItems: 'center', justifyContent: 'center' },
  notificationSecondaryText: { color: text, fontSize: 15, fontWeight: '800' },
  profileHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  profileToggleButton: { minWidth: 72, height: 34, paddingHorizontal: 16, borderRadius: 17, backgroundColor: '#E8F7F1', alignItems: 'center', justifyContent: 'center' },
  profileToggleButtonText: { color: mintDark, fontSize: 13, fontWeight: '800' },
  profileHistoryList: { gap: 10 },
  profileHistoryItem: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#E8F1ED' },
  profileHistoryTitle: { color: text, fontSize: 16, fontWeight: '800', marginBottom: 4 },
  profileHistoryDetail: { color: sub, fontSize: 13 },
  profileHeroCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 0.5, borderColor: '#D4EEE3', marginBottom: 18, overflow: 'hidden' },
  profileHeroTop: { backgroundColor: mint, minHeight: 90, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center' },
  profileAvatar: { width: 52, height: 52, borderRadius: 26, borderWidth: 0.5, borderColor: '#D4EEE3', backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  profileAvatarIcon: { fontSize: 22, color: '#fff' },
  profileHeroTextGroup: { flex: 1, minWidth: 0, paddingRight: 8 },
  profileHeroName: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  profileHeroSub: { color: '#E8FAF4', fontSize: 11, fontWeight: '500' },
  profileHeroChip: { minWidth: 98, height: 22, flexShrink: 0, backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 12, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  profileHeroChipText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  profileMetaGrid: { flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingVertical: 16 },
  profileMetaBox: { flex: 1, backgroundColor: '#F0FAF5', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14 },
  profileMetaLabel: { color: sub, fontSize: 10, fontWeight: '600', marginBottom: 4 },
  profileMetaValue: { color: text, fontSize: 12, fontWeight: '700', lineHeight: 16 },
  profileSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  profileSectionIcon: { color: mint, fontSize: 20, marginRight: 8 },
  profileGhostLink: { paddingHorizontal: 4, paddingVertical: 4 },
  profileGhostLinkText: { color: mint, fontSize: 11, fontWeight: '700' },
  fillBagBundleGuide: { color: sub, fontSize: 14, lineHeight: 22, marginTop: 14 },
  fillBagEmptyCard: {
    minHeight: 280,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#D7EFE6',
    backgroundColor: '#F6FCF9',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
    marginBottom: 22,
  },
  fillBagEmptyIcon: { color: mint, fontSize: 30, marginBottom: 18, fontWeight: '700' },
  fillBagEmptyTitle: { color: text, fontSize: 22, fontWeight: '800', marginBottom: 10, textAlign: 'center' },
  fillBagEmptyDescription: { color: sub, fontSize: 14, lineHeight: 22, textAlign: 'center' },
  fillBagReservationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D7EFE6',
    marginBottom: 18,
    overflow: 'hidden',
  },
  fillBagReservationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: '#F7FCFA',
  },
  fillBagReservationPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: 0,
    paddingRight: 10,
  },
  fillBagReservationHeaderText: { flex: 1, minWidth: 0, paddingRight: 12 },
  fillBagReservationTitleWrap: { flex: 1, minWidth: 0 },
  fillBagReservationTitle: { color: text, fontSize: 17, fontWeight: '800', marginBottom: 4 },
  fillBagReservationMeta: { color: sub, fontSize: 12, lineHeight: 17 },
  fillBagReservationStatus: { color: mintDark, fontSize: 12, fontWeight: '700', marginTop: 10 },
  fillBagReservationArrow: { color: '#8EA89C', fontSize: 20, fontWeight: '700' },
  fillBagDeleteButton: {
    minWidth: 52,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#F3B5BB',
    backgroundColor: '#FFF5F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fillBagDeleteButtonText: { color: '#E07070', fontSize: 12, fontWeight: '800' },
  fillBagExpandedContent: { padding: 14, backgroundColor: '#F0FAF5' },
  fillBagBundleSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D7EFE6',
    padding: 18,
    marginTop: 14,
  },
  careBundleSelectorRow: { gap: 10, paddingBottom: 4 },
  careBundleChip: {
    width: 188,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D4EEE3',
    backgroundColor: '#F7FCFA',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  careBundleChipActive: {
    backgroundColor: '#EAF8F2',
    borderColor: mint,
  },
  careBundleChipTitle: { color: text, fontSize: 14, fontWeight: '800', marginBottom: 4 },
  careBundleChipTitleActive: { color: mintDark },
  careBundleChipSub: { color: sub, fontSize: 12, lineHeight: 16 },
  careBundleChipSubActive: { color: '#5D8D7E' },
  profileHistoryRow: { minHeight: 55, borderTopWidth: 1, borderTopColor: '#D4EEE3', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, paddingVertical: 12 },
  profileHistoryDate: { color: sub, fontSize: 11, marginBottom: 2 },
  profileHistoryArrow: { color: '#A8C4BA', fontSize: 26, lineHeight: 26, fontWeight: '400' },
  profileReservationItem: { minHeight: 74, borderTopWidth: 1, borderTopColor: '#E8F1ED', flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  profileReservationBadge: { width: 72, height: 30, borderRadius: 15, backgroundColor: '#D4F1E4', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  profileReservationBadgeText: { color: mintDark, fontSize: 13, fontWeight: '800' },
  profileReservationTextBlock: { flex: 1 },
  profileReservationName: { color: text, fontSize: 17, fontWeight: '800', marginBottom: 4 },
  profileReservationDetail: { color: sub, fontSize: 13 },
  profileReservationStack: { gap: 12 },
  profileReservationCard: { backgroundColor: '#F0FAF5', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 14 },
  profileReservationBundlePreview: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: '#D4EEE3',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  profileReservationBundlePreviewTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  profileReservationBundleTitle: { color: mintDark, fontSize: 11, fontWeight: '800', marginBottom: 4 },
  profileReservationBundleToggle: { color: mint, fontSize: 11, fontWeight: '700' },
  profileReservationBundleText: { color: text, fontSize: 12, lineHeight: 17, marginBottom: 4 },
  profileReservationBundleMeta: { color: sub, fontSize: 11, fontWeight: '600' },
  profileReservationBundleExpanded: { gap: 10, marginTop: -2, marginBottom: 12 },
  profileReservationExpandedBlock: {
    backgroundColor: '#EDF8F4',
    borderLeftWidth: 3,
    borderLeftColor: mint,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  profileReservationExpandedWarnBlock: {
    backgroundColor: '#FFEDEE',
    borderLeftColor: '#F47C82',
  },
  profileReservationExpandedTitle: { color: mintDark, fontSize: 12, fontWeight: '800', marginBottom: 4 },
  profileReservationExpandedWarnTitle: { color: '#F47C82', fontSize: 12, fontWeight: '800', marginBottom: 4 },
  profileReservationExpandedText: { color: '#6D8F85', fontSize: 12, lineHeight: 18 },
  profileReservationExpandedCritical: {
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: '#FF9AA0',
    backgroundColor: '#FFF7F7',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  profileReservationExpandedCriticalTitle: { color: '#F47C82', fontSize: 12, fontWeight: '800', marginBottom: 4 },
  profileReservationExpandedCriticalText: { color: '#6D8F85', fontSize: 12, lineHeight: 18 },
  profileReservationExpandedSummary: {
    backgroundColor: '#EDF8F4',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  profileReservationExpandedSummaryTitle: { color: text, fontSize: 12, fontWeight: '800', marginBottom: 4 },
  profileReservationExpandedSummaryText: { color: '#6D8F85', fontSize: 12, lineHeight: 18 },
  profileReservationExpandedSettings: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: '#D4EEE3',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  profileReservationExpandedSettingsTitle: { color: text, fontSize: 12, fontWeight: '800', marginBottom: 4 },
  profileReservationExpandedSettingsText: { color: mintDark, fontSize: 12, fontWeight: '700', marginBottom: 4 },
  profileReservationExpandedSettingsSub: { color: sub, fontSize: 11, lineHeight: 16 },
  profileReservationCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  profileReservationBadgeMuted: { backgroundColor: '#DDEAE5' },
  profileReservationBadgeTextMuted: { color: '#8EA89C' },
  profileReservationActionRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  profileReservationPrimary: { flex: 1, height: 42, borderRadius: 16, backgroundColor: mint, alignItems: 'center', justifyContent: 'center' },
  profileReservationPrimaryText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  profileReservationSecondary: { flex: 1, height: 42, borderRadius: 16, borderWidth: 0.5, borderColor: mint, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  profileReservationSecondaryText: { color: mintDark, fontSize: 12, fontWeight: '700' },
  profileReservationEmpty: { backgroundColor: '#F0FAF5', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 20 },
  profileReservationEmptyText: { color: '#8EA89C', fontSize: 14, lineHeight: 20 },
  profileMenuCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 0.5, borderColor: '#D4EEE3', paddingHorizontal: 18, paddingVertical: 10, marginBottom: 22 },
  profileMenuRow: { height: 46, flexDirection: 'row', alignItems: 'center' },
  profileMenuDivider: { height: 0.5, backgroundColor: '#D4EEE3' },
  profileMenuIcon: { color: '#8FA9A0', fontSize: 20, marginRight: 12 },
  profileMenuText: { flex: 1, color: text, fontSize: 13, fontWeight: '700' },
  profileMenuLogoutIcon: { color: '#E16B6B', fontSize: 20, marginRight: 12 },
  profileMenuLogoutText: { flex: 1, color: '#E16B6B', fontSize: 13, fontWeight: '700' },
  profileDetailSheet: { backgroundColor: '#fff', borderRadius: 22, paddingHorizontal: 22, paddingTop: 22, paddingBottom: 20, marginHorizontal: 26 },
  profileDetailTitle: { color: sub, fontSize: 13, fontWeight: '700', marginBottom: 10 },
  profileDetailHeading: { color: text, fontSize: 20, fontWeight: '800', marginBottom: 10 },
  profileDetailBody: { color: '#6D8F85', fontSize: 14, lineHeight: 22, marginBottom: 18 },
  profileDetailButton: { height: 46, borderRadius: 14, backgroundColor: mint, alignItems: 'center', justifyContent: 'center' },
  profileDetailButtonText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  profileSettingsStack: { gap: 2, marginBottom: 16 },
  reserveOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.32)',
    justifyContent: 'flex-end',
  },
  reserveSheet: {
    backgroundColor: '#F6FBF8',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 24,
  },
  reserveHeader: {
    backgroundColor: mint,
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingVertical: 18,
    marginBottom: 16,
  },
  reserveBadge: { color: '#E9FFF6', fontSize: 14, fontWeight: '800', marginBottom: 8 },
  reserveName: { color: '#fff', fontSize: 22, fontWeight: '800' },
  reserveCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E4F1EC',
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  reserveInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  reserveInfoIcon: { width: 24, color: mint, fontSize: 17, fontWeight: '800' },
  reserveInfoText: { flex: 1, color: text, fontSize: 15 },
  reserveActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  reserveCancel: { flex: 1, height: 52, borderRadius: 18, backgroundColor: '#F2D9DD', alignItems: 'center', justifyContent: 'center' },
  reserveCancelText: { color: '#C85C72', fontSize: 16, fontWeight: '800' },
  reserveConfirm: { flex: 1, height: 52, borderRadius: 18, backgroundColor: mintDark, alignItems: 'center', justifyContent: 'center' },
  reserveConfirmText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  segment: { height: 52, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: line, flexDirection: 'row', padding: 4, marginBottom: 50 },
  segmentActive: { flex: 1, borderRadius: 10, backgroundColor: mint, alignItems: 'center', justifyContent: 'center' },
  segmentItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  segmentActiveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  segmentText: { color: sub, fontSize: 16, fontWeight: '700' },
  whiteCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#D7EFE6', padding: 20, marginBottom: 22 },
  heart: { color: mint, fontSize: 27, lineHeight: 28, marginRight: 8 },
  habitRow: { flexDirection: 'row', gap: 14, marginTop: 22 },
  habitGood: { flex: 1, backgroundColor: '#EDF8F4', borderRadius: 10, borderLeftWidth: 3, borderLeftColor: mint, paddingHorizontal: 12, paddingVertical: 16, minHeight: 104 },
  habitBad: { flex: 1, backgroundColor: '#FFE5E6', borderRadius: 10, borderLeftWidth: 3, borderLeftColor: '#F47C82', paddingHorizontal: 12, paddingVertical: 16, minHeight: 104 },
  habitGoodTitle: { color: mintDark, fontWeight: '800', fontSize: 13, marginBottom: 6 },
  habitBadTitle: { color: '#F47C82', fontWeight: '800', fontSize: 13, marginBottom: 6 },
  habitText: { color: '#89A79D', fontSize: 13, lineHeight: 18 },
  habitTextSingle: { color: '#89A79D', fontSize: 13, lineHeight: 18 },
  stackCardColumn: { gap: 14, marginTop: 18, marginHorizontal: 6 },
  sparkle: { color: mint, fontSize: 22, marginRight: 10 },
  summaryBox: { backgroundColor: '#EDF8F4', borderLeftWidth: 3, borderLeftColor: mint, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 8 },
  summaryText: { color: text, fontSize: 14, lineHeight: 20 },
  bellGreen: { color: mint, fontSize: 21, marginRight: 8 },
  medsGoodBox: { backgroundColor: '#EDF8F4', borderRadius: 10, borderLeftWidth: 3, borderLeftColor: mint, padding: 18, marginTop: 16 },
  medsGoodTitle: { color: mintDark, fontWeight: '800', fontSize: 14, marginBottom: 6 },
  medsGoodText: { color: '#89A79D', fontSize: 14, lineHeight: 20 },
  medsBadBox: { backgroundColor: '#FFE5E6', borderRadius: 10, borderLeftWidth: 3, borderLeftColor: '#F47C82', padding: 18, marginTop: 10 },
  medsBadTitle: { color: '#F47C82', fontWeight: '800', fontSize: 14, marginBottom: 6 },
  medsBadText: { color: '#89A79D', fontSize: 14, lineHeight: 20 },
  medsCriticalBox: { backgroundColor: '#FCE7E7', borderRadius: 10, borderWidth: 1, borderColor: '#F47C82', padding: 18, marginTop: 10 },
  medsCriticalTitle: { color: '#F47C82', fontWeight: '800', fontSize: 14, marginBottom: 6 },
  medsCriticalText: { color: '#89A79D', fontSize: 14, lineHeight: 20 },
  medsGoodBoxTight: { backgroundColor: '#EDF8F4', borderRadius: 10, borderLeftWidth: 3, borderLeftColor: mint, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 15, minHeight: 76 },
  medsBadBoxTight: { backgroundColor: '#FFE5E6', borderRadius: 10, borderLeftWidth: 3, borderLeftColor: '#F47C82', paddingHorizontal: 18, paddingTop: 16, paddingBottom: 15, minHeight: 76 },
  medsCriticalBoxTight: { backgroundColor: '#FFF1F1', borderRadius: 10, borderWidth: 1, borderColor: '#F47C82', paddingHorizontal: 18, paddingTop: 15, paddingBottom: 15, minHeight: 92 },
  mutedTitle: { color: sub, fontSize: 14, marginTop: 16, marginBottom: 12 },
  optionRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  optionActive: { flex: 1, height: 52, borderRadius: 10, backgroundColor: mint, alignItems: 'center', justifyContent: 'center' },
  option: { flex: 1, height: 52, borderRadius: 10, borderWidth: 1, borderColor: '#AFC8BF', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  optionActiveText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  optionText: { color: '#7D9B92', fontSize: 16, fontWeight: '700' },
  toggleRow: { minHeight: 58, borderBottomWidth: 1, borderBottomColor: '#E3EAE7', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  toggleTitle: { color: text, fontSize: 16, fontWeight: '800' },
  toggleDesc: { color: sub, fontSize: 13, marginTop: 4 },
  toggleTextBlock: { flex: 1, minWidth: 0 },
  toggle: { width: 52, height: 32, borderRadius: 16, backgroundColor: '#D3F0E6', padding: 3 },
  toggleOn: { backgroundColor: mint },
  knob: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#fff' },
  knobOn: { marginLeft: 20 },
  moreButton: { height: 52, borderRadius: 8, backgroundColor: mint, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  moreButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  nav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 72,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: line,
    flexDirection: 'row',
    paddingBottom: 8,
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navIcon: { color: '#A9C5BC', fontSize: 24, lineHeight: 28, marginBottom: 1 },
  navLabel: { color: '#A9C5BC', fontSize: 12 },
  navActive: { color: mint },
});

