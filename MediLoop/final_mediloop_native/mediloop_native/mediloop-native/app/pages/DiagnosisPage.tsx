import React from "react";
import {
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Circle, Line, Path, Polygon, Rect, Svg } from "react-native-svg";
import { diagnosisResults, hospitals } from "../../data/mockData";
import { styles } from "../../styles/diagnosis";
import { Hospital } from "../../types";

interface DiagnosisPageProps {
  onBack: () => void;
  onReserve: (hospital: Hospital) => void;
}

const DiagnosisPage: React.FC<DiagnosisPageProps> = ({ onBack, onReserve }) => {
  const openNaverMap = (name: string) => {
    Linking.openURL(
      `https://map.naver.com/v5/search/${encodeURIComponent(name)}`,
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 결과 카드 */}
      <View style={styles.resultCard}>
        <View style={styles.resultHeader}>
          <View style={styles.resultTitleRow}>
            <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <Line
                x1="18"
                y1="20"
                x2="18"
                y2="10"
                stroke="#5DCAA5"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <Line
                x1="12"
                y1="20"
                x2="12"
                y2="4"
                stroke="#5DCAA5"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <Line
                x1="6"
                y1="20"
                x2="6"
                y2="14"
                stroke="#5DCAA5"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </Svg>
            <Text style={styles.resultTitle}>분석 결과 요약</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>AI 진단 추정</Text>
          </View>
        </View>

        <View style={styles.topDisease}>
          <View>
            <Text style={styles.diseaseName}>
              {diagnosisResults[0].disease}
            </Text>
            <Text style={styles.diseaseSub}>가장 높은 일치율</Text>
          </View>
          <View style={styles.circle}>
            <Text style={styles.circleText}>
              {diagnosisResults[0].probability}%
            </Text>
          </View>
        </View>

        <View style={styles.barList}>
          {diagnosisResults.map((r) => (
            <View key={r.id} style={styles.barItem}>
              <View style={styles.barLabels}>
                <Text style={styles.barLabel}>{r.disease}</Text>
                <Text style={styles.barLabel}>{r.probability}%</Text>
              </View>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${r.probability}%` as any },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.adviceBox}>
          <Text style={styles.adviceText}>
            충분한 휴식과 수분 섭취가 권장됩니다. 발열이 지속될 경우 내원을
            추천합니다.
          </Text>
        </View>
      </View>

      <View style={styles.hospSectionTitle}>
        <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
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
        <Text style={styles.hospSectionTitleText}>주변 병원 추천</Text>
      </View>

      {hospitals.map((h, i) => (
        <View
          key={h.id}
          style={[styles.hospCard, i === 1 && styles.hospCardEmergency]}
        >
          <View
            style={[styles.hospBadge, i === 1 && styles.hospBadgeEmergency]}
          >
            <Text
              style={[
                styles.hospBadgeText,
                i === 1 && styles.hospBadgeTextEmergency,
              ]}
            >
              {i === 1 ? "응급 병원" : "최우선 일반 병원"}
            </Text>
          </View>
          <Text style={styles.hospName}>{h.name}</Text>
          <View style={styles.hospAddr}>
            <Svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <Path
                d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"
                stroke="#aaa"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Circle
                cx="12"
                cy="10"
                r="3"
                stroke="#aaa"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={styles.hospAddrText}>
              {h.address} · {h.distance}
            </Text>
          </View>
          <View style={styles.hospBtns}>
            <TouchableOpacity
              style={[
                styles.hospBtnReserve,
                i === 1 && styles.hospBtnReserveEmergency,
              ]}
              onPress={() => onReserve(h)}
            >
              <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <Rect
                  x="3"
                  y="4"
                  width="18"
                  height="18"
                  rx="2"
                  stroke={i === 1 ? "#333" : "#fff"}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Line
                  x1="16"
                  y1="2"
                  x2="16"
                  y2="6"
                  stroke={i === 1 ? "#333" : "#fff"}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <Line
                  x1="8"
                  y1="2"
                  x2="8"
                  y2="6"
                  stroke={i === 1 ? "#333" : "#fff"}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <Line
                  x1="3"
                  y1="10"
                  x2="21"
                  y2="10"
                  stroke={i === 1 ? "#333" : "#fff"}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </Svg>
              <Text
                style={[
                  styles.hospBtnReserveText,
                  i === 1 && { color: "#333" },
                ]}
              >
                예약하기
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.hospBtnNav, i === 1 && styles.hospBtnNavEmergency]}
              onPress={() => openNaverMap(h.name)}
            >
              <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <Polygon
                  points="3 11 22 2 13 21 11 13 3 11"
                  stroke={i === 1 ? "#E53935" : "#333"}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text
                style={[styles.hospBtnNavText, i === 1 && { color: "#E53935" }]}
              >
                길찾기
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <Text style={styles.disclaimer}>
        AI 분석은 참고용이며 의학적 진단이 아닙니다.
      </Text>
    </ScrollView>
  );
};

export default DiagnosisPage;
