import React, { useState } from "react";
import {
  Linking,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Circle,
  Line,
  Path,
  Polygon,
  Polyline,
  Rect,
  Svg,
} from "react-native-svg";
import { hospitals } from "../../data/mockData";
import { styles } from "../../styles/hospital";
import { Hospital } from "../../types";

interface HospitalDetailProps {
  hospital: Hospital;
  onClose: () => void;
  onReserve: (hospital: Hospital) => void;
}

const HospitalDetail: React.FC<HospitalDetailProps> = ({
  hospital,
  onClose,
  onReserve,
}) => (
  <View style={styles.floatingPanel}>
    <View style={styles.floatingHandle} />
    <View style={styles.floatingTop}>
      <View>
        <Text style={styles.floatingHospName}>{hospital.name}</Text>
        <View style={styles.floatingHospInfo}>
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
          <Text style={styles.floatingHospInfoText}>{hospital.address}</Text>
        </View>
        <View style={styles.floatingHospInfo}>
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
          <Text style={styles.floatingHospInfoText}>
            {hospital.openingHours}
          </Text>
        </View>
        {hospital.phone && (
          <View style={styles.floatingHospInfo}>
            <Svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <Path
                d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"
                stroke="#5DCAA5"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={styles.floatingHospInfoText}>{hospital.phone}</Text>
          </View>
        )}
      </View>
      <TouchableOpacity style={styles.floatingCloseBtn} onPress={onClose}>
        <Text style={styles.floatingCloseBtnText}>✕</Text>
      </TouchableOpacity>
    </View>
    <View style={styles.floatingRating}>
      <Text style={{ fontSize: 13, color: "#f5a623" }}>⭐</Text>
      <Text style={styles.floatingRatingScore}>{hospital.rating}</Text>
      <Text style={styles.floatingRatingDist}>· {hospital.distance}</Text>
    </View>
    <View style={styles.floatingBtns}>
      <TouchableOpacity
        style={styles.floatingBtnReserve}
        onPress={() => onReserve(hospital)}
      >
        <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <Rect
            x="3"
            y="4"
            width="18"
            height="18"
            rx="2"
            stroke="#fff"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Line
            x1="16"
            y1="2"
            x2="16"
            y2="6"
            stroke="#fff"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <Line
            x1="8"
            y1="2"
            x2="8"
            y2="6"
            stroke="#fff"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <Line
            x1="3"
            y1="10"
            x2="21"
            y2="10"
            stroke="#fff"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </Svg>
        <Text style={styles.floatingBtnReserveText}>예약하기</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.floatingBtnNav}
        onPress={() =>
          Linking.openURL(
            `https://map.naver.com/v5/search/${encodeURIComponent(hospital.name)}`,
          )
        }
      >
        <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <Polygon
            points="3 11 22 2 13 21 11 13 3 11"
            stroke="#333"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
        <Text style={styles.floatingBtnNavText}>네이버지도</Text>
      </TouchableOpacity>
    </View>
  </View>
);

interface HospitalPageProps {
  onReserve: (hospital: Hospital) => void;
}

const HospitalPage: React.FC<HospitalPageProps> = ({ onReserve }) => {
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(
    null,
  );
  const [activeFilter, setActiveFilter] = useState(0);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.searchBar}>
          <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <Circle
              cx="11"
              cy="11"
              r="8"
              stroke="#5DCAA5"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Line
              x1="21"
              y1="21"
              x2="16.65"
              y2="16.65"
              stroke="#5DCAA5"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </Svg>
          <TextInput
            style={styles.searchInput}
            placeholder="증상과 기저질환을 입력해주세요."
            placeholderTextColor="#bbb"
          />
          <TouchableOpacity style={styles.searchBtn}>
            <Text style={styles.searchBtnText}>검색</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.pctRow}>
          <Text style={styles.pctLabel}>단순 감기</Text>
          <View style={styles.pctTrack}>
            <View style={[styles.pctFill, { width: "85%" as any }]} />
          </View>
          <Text style={styles.pctValue}>85%</Text>
          <TouchableOpacity style={styles.pctInfoBtn}>
            <Text style={styles.pctInfoBtnText}>i</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.mapArea}>
          <View style={styles.mapBg}>
            <Text style={{ fontSize: 38 }}>🗺️</Text>
            <Text style={styles.mapBgText}>
              지도 영역 (카카오맵 / 네이버맵)
            </Text>
          </View>
          <View style={styles.mapPin}>
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <Path
                d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"
                stroke="#E53935"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Circle
                cx="12"
                cy="10"
                r="3"
                stroke="#E53935"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={styles.mapPinLabel}>강남연세내과</Text>
          </View>
          <View style={styles.mapFilterChips}>
            {["가까운순", "별점순", "리뷰순"].map((label, i) => (
              <TouchableOpacity
                key={label}
                style={[
                  styles.mapChip,
                  activeFilter === i && styles.mapChipActive,
                ]}
                onPress={() => setActiveFilter(i)}
              >
                <Text
                  style={[
                    styles.mapChipText,
                    activeFilter === i && styles.mapChipTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={styles.hospListTitle}>주변 추천 병원</Text>

        {hospitals.map((hospital) => (
          <TouchableOpacity
            key={hospital.id}
            style={styles.hospListCard}
            onPress={() => setSelectedHospital(hospital)}
          >
            <View style={styles.hospListTop}>
              <View style={styles.hospOpenBadge}>
                <Text style={styles.hospOpenBadgeText}>영업중</Text>
              </View>
              <Text style={styles.hospListName}>{hospital.name}</Text>
            </View>
            <Text style={styles.hospListMeta}>
              {hospital.distance} · {hospital.address} · {hospital.openingHours}
            </Text>
            <View style={styles.hospListBtns}>
              <TouchableOpacity
                style={styles.hospListBtnReserve}
                onPress={() => onReserve(hospital)}
              >
                <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <Rect
                    x="3"
                    y="4"
                    width="18"
                    height="18"
                    rx="2"
                    stroke="#fff"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Line
                    x1="16"
                    y1="2"
                    x2="16"
                    y2="6"
                    stroke="#fff"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <Line
                    x1="8"
                    y1="2"
                    x2="8"
                    y2="6"
                    stroke="#fff"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <Line
                    x1="3"
                    y1="10"
                    x2="21"
                    y2="10"
                    stroke="#fff"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </Svg>
                <Text style={styles.hospListBtnReserveText}>예약하기</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.hospListBtnNav}
                onPress={() =>
                  Linking.openURL(
                    `https://map.naver.com/v5/search/${encodeURIComponent(hospital.name)}`,
                  )
                }
              >
                <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <Polygon
                    points="3 11 22 2 13 21 11 13 3 11"
                    stroke="#333"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                <Text style={styles.hospListBtnNavText}>네이버지도</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedHospital && (
        <Modal transparent animationType="slide" visible={!!selectedHospital}>
          <TouchableOpacity
            style={styles.floatingOverlay}
            onPress={() => setSelectedHospital(null)}
          />
          <HospitalDetail
            hospital={selectedHospital}
            onClose={() => setSelectedHospital(null)}
            onReserve={onReserve}
          />
        </Modal>
      )}
    </View>
  );
};

export default HospitalPage;
