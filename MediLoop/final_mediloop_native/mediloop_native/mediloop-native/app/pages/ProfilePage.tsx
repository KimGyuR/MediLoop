import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Circle, Line, Path, Polyline, Rect, Svg } from "react-native-svg";
import { styles } from "../../styles/profile";

const ProfilePage: React.FC = () => {
  const [showAllSymptoms, setShowAllSymptoms] = useState(false);

  const symptoms = [
    { date: "오늘", name: "두통 및 발열" },
    { date: "05.20", name: "소화 불량" },
    { date: "05.15", name: "심한 근육통" },
    { date: "05.10", name: "기침 및 콧물" },
    { date: "05.05", name: "복통" },
  ];

  const visibleSymptoms = showAllSymptoms ? symptoms : symptoms.slice(0, 3);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.profileCard}>
        <View style={styles.profileTop}>
          <View style={styles.profileUserRow}>
            <View style={styles.profileUserLeft}>
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
              <View>
                <Text style={styles.profileName}>김철수 님</Text>
                <Text style={styles.profileDays}>425일째 관리 중</Text>
              </View>
            </View>
            <View style={styles.profileTypeBadge}>
              <Text style={styles.profileTypeBadgeText}>A형 / 만 32세</Text>
            </View>
          </View>
        </View>

        <View style={styles.profileBottom}>
          <View style={styles.profileInfoRow}>
            <View style={styles.profileInfoBox}>
              <Text style={styles.profileInfoLabel}>기저 질환</Text>
              <Text style={styles.profileInfoValue}>고혈압(초기)</Text>
            </View>
            <View style={styles.profileInfoDivider} />
            <View style={styles.profileInfoBox}>
              <Text style={styles.profileInfoLabel}>알레르기</Text>
              <Text style={styles.profileInfoValue}>비염, 감각류</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.habitCard}>
        <View style={styles.habitTitleRow}>
          <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <Path
              d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
              stroke="#5DCAA5"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <Text style={styles.habitTitleText}>생활 습관 및 주의사항</Text>
        </View>
        <View style={styles.habitGreenBox}>
          <Text style={styles.habitGreenTitle}>추천 생활습관</Text>
          <Text style={styles.habitGreenContent}>
            충분한 수면, 실내 습도 50% 유지, 수분 섭취 1.5L 이상
          </Text>
        </View>
        <View style={styles.habitRedBox}>
          <Text style={styles.habitRedTitle}>주의해야 할 음식</Text>
          <Text style={styles.habitRedContent}>
            자극적인 음식, 카페인, 음주 절대 금지
          </Text>
        </View>
        <View style={styles.criticalBox}>
          <Text style={styles.criticalTitle}>CRITICAL WARNING</Text>
          <Text style={styles.criticalContent}>
            아세트아미노펜 복용 중 음주는 간 손상의 치명적인 원인이 될 수
            있습니다.
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
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
            <Text style={styles.cardTitleText}>지난 증상 기록</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowAllSymptoms(!showAllSymptoms)}
          >
            <Text style={styles.viewAllBtn}>
              {showAllSymptoms ? "접기" : "전체보기"}
            </Text>
          </TouchableOpacity>
        </View>
        {visibleSymptoms.map((s, i) => (
          <TouchableOpacity key={i} style={styles.symptomItem}>
            <View>
              <Text style={styles.symptomDate}>{s.date}</Text>
              <Text style={styles.symptomName}>{s.name}</Text>
            </View>
            <Text style={styles.symptomArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
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
            <Text style={styles.cardTitleText}>최근 병원 예약</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.reservationItem}>
          <View style={styles.reservationItemLeft}>
            <View style={styles.reservationDBadge}>
              <Text style={styles.reservationDBadgeText}>D-3</Text>
            </View>
            <Text style={styles.reservationHospName}>
              서울대학교병원 (내과)
            </Text>
            <Text style={styles.reservationDate}>
              2026.05.28(목) 오전 10:30
            </Text>
          </View>
          <Text style={styles.settingsArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.reservationItem}>
          <View style={styles.reservationItemLeft}>
            <View style={styles.reservationDoneBadge}>
              <Text style={styles.reservationDoneBadgeText}>진료 완료</Text>
            </View>
            <Text style={styles.reservationHospName}>연세바른정형외과</Text>
            <Text style={styles.reservationDate}>2026.04.30(목)</Text>
          </View>
          <Text style={styles.settingsArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.settingsCard}>
        <TouchableOpacity style={styles.settingsItem}>
          <View style={styles.settingsItemLeft}>
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
            <Text style={styles.settingsItemLabel}>설정 및 계정 관리</Text>
          </View>
          <Text style={styles.settingsArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.settingsItem, { borderBottomWidth: 0 }]}
        >
          <View style={styles.settingsItemLeft}>
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
            <Text style={styles.settingsItemLabelDanger}>로그아웃</Text>
          </View>
          <Text style={styles.settingsArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 8 }} />
    </ScrollView>
  );
};

export default ProfilePage;
