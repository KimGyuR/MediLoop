import React, { useState } from "react";
import {
    Linking,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Path, Svg } from "react-native-svg";
import { styles } from "../../styles/notification";

type Props = { onBack: () => void };

const NotificationPage: React.FC<Props> = ({ onBack }) => {
  const [feedback, setFeedback] = useState<"yes" | "no" | null>(null);
  const [sideEffect, setSideEffect] = useState<"yes" | "no" | null>(null);
  const [meal, setMeal] = useState<"before" | "after" | "none">("before");
  const [dosage, setDosage] = useState<"3" | "2" | "custom">("3");
  const [alarms, setAlarms] = useState({
    medicine: true,
    feedback: true,
    hospital: false,
  });

  const toggleAlarm = (key: keyof typeof alarms) => {
    setAlarms((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 18l-6-6 6-6"
              stroke="#111"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>알림</Text>
        <TouchableOpacity style={styles.markAllBtn}>
          <Text style={styles.markAllText}>모두읽음</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>오늘</Text>

        {/* 1. 피드백 루프 알림 */}
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
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
            <Text style={[styles.cardTitle, { flex: 1 }]}>
              피드백 루프 알림
            </Text>
            <Text style={styles.cardTime}>오전 9:00</Text>
          </View>
          <Text style={styles.cardHeadline}>열이 내렸나요? 🌡</Text>
          <Text style={styles.cardBody}>
            복용 중인 약의 효과를 확인하고 있어요. 현재 상태를 알려주세요.
          </Text>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.actionBtnPrimary,
                feedback === "yes" && { opacity: 0.75 },
              ]}
              onPress={() => setFeedback("yes")}
            >
              <Text style={styles.actionBtnTextPrimary}>✓ 네, 나아졌어요</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionBtnSecondary,
                feedback === "no" && { opacity: 0.75 },
              ]}
              onPress={() => setFeedback("no")}
            >
              <Text style={styles.actionBtnTextSecondary}>아직 아파요</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. 부작용 감지 알림 */}
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <Path
                d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                stroke="#E24B4A"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M12 9v4"
                stroke="#E24B4A"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <Path
                d="M12 17h.01"
                stroke="#E24B4A"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </Svg>
            <Text style={[styles.cardTitle, { flex: 1 }]}>
              부작용 감지 알림
            </Text>
            <Text style={styles.cardTime}>오전 11:00</Text>
          </View>
          <Text style={styles.cardHeadline}>부작용이 감지되었어요 ⚠️</Text>
          <Text style={styles.cardBody}>
            아세트아미노펜 복용 후 두드러기나 발진 증상이 나타날 수 있어요. 이런
            증상이 있으신가요?
          </Text>
          <Text style={styles.cardLegal}>
            본 알림은 참고용이며 의료법 제 27조를 준수합니다.
          </Text>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.actionBtnDanger,
                sideEffect === "yes" && { opacity: 0.75 },
              ]}
              onPress={() => setSideEffect("yes")}
            >
              <Text style={styles.actionBtnTextDanger}>증상 있어요</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionBtnSecondary,
                sideEffect === "no" && { opacity: 0.75 },
              ]}
              onPress={() => setSideEffect("no")}
            >
              <Text style={styles.actionBtnTextSecondary}>괜찮아요</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. 병원 재방문 추천 */}
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <Path
                d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
                stroke="#888"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M9 22V12h6v10"
                stroke="#888"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={[styles.cardTitle, { flex: 1 }]}>
              병원 재방문 추천
            </Text>
            <Text style={styles.cardTime}>오후 2:00</Text>
          </View>
          <Text style={styles.cardHeadline}>
            증상이 3일 이상 지속되고 있어요 🏥
          </Text>
          <Text style={styles.cardBody}>
            병원 방문을 권장합니다. 가까운 병원을 찾아드릴게요.
          </Text>
          <View style={styles.hospBox}>
            <View style={styles.hospTopRow}>
              <View style={styles.hospBadgeRow}>
                <View style={styles.hospRecommendBadge}>
                  <Text style={styles.hospRecommendBadgeText}>추천 병원</Text>
                </View>
              </View>
              <Text style={styles.hospRating}>4.9</Text>
            </View>
            <Text style={styles.hospName}>강남 연세 이비인후과</Text>
            <Text style={styles.hospMeta}>450m · 강남구 · 09:00 ~18:00</Text>
            <View style={styles.hospBtnRow}>
              <TouchableOpacity style={styles.hospBtnReserve}>
                <Text style={styles.hospBtnReserveText}>예약하기</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.hospBtnNav}
                onPress={() =>
                  Linking.openURL(
                    "https://map.naver.com/v5/search/강남연세이비인후과",
                  )
                }
              >
                <Text style={styles.hospBtnNavText}>네이버 지도</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 4. AI 부작용 감지 요약 */}
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <Path
                d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"
                stroke="#5DCAA5"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={[styles.cardTitle, { flex: 1 }]}>
              AI 부작용 감지 요약
            </Text>
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>참고용</Text>
            </View>
          </View>
          <View style={styles.aiRow}>
            <View>
              <Text style={styles.aiDiseaseName}>급성 상기도 감염</Text>
              <Text style={styles.aiDiseaseSub}>가장 높은 일치율</Text>
            </View>
            <View style={styles.aiCircle}>
              <Text style={styles.aiCircleText}>87%</Text>
            </View>
          </View>
          <View style={styles.aiAdvice}>
            <Text style={styles.aiAdviceText}>
              최근 3개월간 호흡기 관련 증상이 15% 감소했습니다.{"\n"}현재 상태는
              매우 안정적입니다.
            </Text>
          </View>
          <Text style={styles.aiLegal}>
            본 정보는 참고용이며 정확한 진단은 전문의와 상담하세요.{"\n"}(의료법
            제27조 준수)
          </Text>
        </View>

        {/* 5. 복약 알림 설정 */}
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
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
            <Text style={[styles.cardTitle, { flex: 1 }]}>복약 알림 설정</Text>
          </View>
          <Text style={styles.subLabel}>약 복용 주기 설정</Text>

          <View style={styles.mealRow}>
            {(["before", "after", "none"] as const).map((m) => {
              const label =
                m === "before" ? "식전" : m === "after" ? "식후" : "관계없음";
              const isActive = meal === m;
              return (
                <TouchableOpacity
                  key={m}
                  style={isActive ? styles.mealChip : styles.mealChipInactive}
                  onPress={() => setMeal(m)}
                >
                  <Text
                    style={
                      isActive
                        ? styles.mealChipText
                        : styles.mealChipTextInactive
                    }
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.dosageRow}>
            {(["3", "2", "custom"] as const).map((d) => (
              <TouchableOpacity
                key={d}
                style={[
                  styles.dosageChip,
                  dosage === d && styles.dosageChipActive,
                ]}
                onPress={() => setDosage(d)}
              >
                <Text
                  style={[
                    styles.dosageChipText,
                    dosage === d && styles.dosageChipTextActive,
                  ]}
                >
                  {d === "3" ? "1일 3회" : d === "2" ? "1일 2회" : "수기 입력"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.pushLabel}>푸시 알림 설정</Text>
          {[
            {
              key: "medicine" as const,
              title: "약 먹을 시간 푸시 알림",
              sub: "설정한 시간에 알림을 보내드려요",
            },
            {
              key: "feedback" as const,
              title: "피드백 루프 푸시 알림",
              sub: "열 내렸나요? 발진 생겼나요?",
            },
            {
              key: "hospital" as const,
              title: "병원 재방문 추천 푸시 알림",
              sub: "증상 지속 시 병원 재방문 안내",
            },
          ].map((item) => (
            <View key={item.key} style={styles.toggleItem}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.toggleItemTitle}>{item.title}</Text>
                <Text style={styles.toggleItemSub}>{item.sub}</Text>
              </View>
              <TouchableOpacity
                style={[styles.toggle, alarms[item.key] && styles.toggleOn]}
                onPress={() => toggleAlarm(item.key)}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    alarms[item.key] && styles.toggleThumbOn,
                  ]}
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* 6. 가까운 일반 병원 */}
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <Path
                d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"
                stroke="#5DCAA5"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M12 10m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0"
                stroke="#5DCAA5"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={[styles.cardTitle, { flex: 1 }]}>
              가까운 일반 병원
            </Text>
          </View>
          <View style={styles.hospBox}>
            <View style={styles.hospTopRow}>
              <View style={styles.hospOpenBadge}>
                <Text style={styles.hospOpenBadgeText}>영업중</Text>
              </View>
            </View>
            <Text style={styles.hospName}>강남 연세 이비인후과</Text>
            <Text style={styles.hospMeta}>450m · 강남구 · 09:00 ~18:00</Text>
            <View style={styles.hospBtnRow}>
              <TouchableOpacity style={styles.hospBtnReserve}>
                <Text style={styles.hospBtnReserveText}>🗓 예약하기</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.hospBtnNav}
                onPress={() =>
                  Linking.openURL(
                    "https://map.naver.com/v5/search/강남연세이비인후과",
                  )
                }
              >
                <Text style={styles.hospBtnNavText}>네이버지도</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 주변 병원 더보기 */}
        <View style={styles.moreBtnWrap}>
          <TouchableOpacity style={styles.moreBtn}>
            <Text style={styles.moreBtnText}>🏥 주변 병원 더보기</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
};

export default NotificationPage;
