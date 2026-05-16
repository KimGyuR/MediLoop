import React, { useState } from "react";
import {
  Linking,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Circle, Line, Path, Polygon, Rect, Svg } from "react-native-svg";
import { styles } from "../../styles/fitbing";
import MedicineManagementPage from "./MedicineManagementPage";

interface FitBingPageProps {
  activeTab: "consult" | "medicine";
}

const FitBingPage: React.FC<FitBingPageProps> = ({ activeTab }) => {
  const [doctorNote, setDoctorNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [dosage, setDosage] = useState<"3" | "2" | "custom">("3");
  const [alarms, setAlarms] = useState({
    feedback: true,
    sideEffect: true,
    hospital: false,
  });

  const handleDiagnose = async () => {
    if (!doctorNote.trim()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setShowResult(true);
    setLoading(false);
  };

  const toggleAlarm = (key: keyof typeof alarms) => {
    setAlarms((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (activeTab === "medicine") {
    return <MedicineManagementPage />;
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.fitbingCard}>
        <View style={styles.fitbingHeader}>
          <Text style={styles.fitbingHeaderSub}>사후 관리</Text>
          <Text style={styles.fitbingHeaderTitle}>진료 후 관리를 시작해요</Text>
        </View>

        <View style={styles.fitbingInputArea}>
          <View>
            <View style={styles.fitbingLabel}>
              <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"
                  stroke="#aaa"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Circle
                  cx="12"
                  cy="13"
                  r="3"
                  stroke="#aaa"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Line
                  x1="12"
                  y1="11"
                  x2="12"
                  y2="9"
                  stroke="#aaa"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <Line
                  x1="11"
                  y1="10"
                  x2="13"
                  y2="10"
                  stroke="#aaa"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </Svg>
              <Text style={styles.fitbingLabelText}>처방전 사진 업로드</Text>
            </View>
            <TouchableOpacity style={styles.fitbingUploadBtn}>
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M13 4h-4L7 7H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10"
                  stroke="#5DCAA5"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Circle
                  cx="9"
                  cy="12"
                  r="3"
                  stroke="#5DCAA5"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Line
                  x1="18"
                  y1="14"
                  x2="18"
                  y2="22"
                  stroke="#5DCAA5"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <Line
                  x1="14"
                  y1="18"
                  x2="22"
                  y2="18"
                  stroke="#5DCAA5"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </Svg>
              <Text style={styles.fitbingUploadBtnText}>사진 업로드</Text>
            </TouchableOpacity>
          </View>

          <View>
            <View style={styles.fitbingLabel}>
              <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 20h9"
                  stroke="#5DCAA5"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
                  stroke="#5DCAA5"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={styles.fitbingLabelText}>의사 소견 입력</Text>
            </View>
            <TextInput
              style={styles.fitbingTextarea}
              multiline
              numberOfLines={4}
              value={doctorNote}
              onChangeText={setDoctorNote}
              placeholder="병명과 의사의 소견을 작성해주세요."
              placeholderTextColor="#bbb"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.fitbingDiagnoseBtn,
              (loading || !doctorNote.trim()) &&
                styles.fitbingDiagnoseBtnDisabled,
            ]}
            onPress={handleDiagnose}
            disabled={loading || !doctorNote.trim()}
          >
            {loading ? (
              <>
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
                <Text style={styles.fitbingDiagnoseBtnText}>분석 중...</Text>
              </>
            ) : (
              <Text style={styles.fitbingDiagnoseBtnText}>
                AI 자가진단 시작
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.fitbingDisclaimer}>
            본 결과는 참고용이며 정확한 진단은 의사에게 문의하세요.
          </Text>
        </View>
      </View>

      {showResult && (
        <View style={styles.fitbingResultArea}>
          <View style={styles.fitbingResultCard}>
            <View style={styles.fitbingResultHeader}>
              <View style={styles.fitbingResultTitleRow}>
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
                <Text style={styles.fitbingResultTitle}>AI 분석 요약</Text>
              </View>
              <View style={styles.fitbingResultBadge}>
                <Text style={styles.fitbingResultBadgeText}>참고용</Text>
              </View>
            </View>

            <View style={styles.fitbingDiseaseRow}>
              <View>
                <Text style={styles.fitbingDiseaseName}>급성 상기도 감염</Text>
                <Text style={styles.fitbingDiseaseSub}>가장 높은 일치율</Text>
              </View>
              <View style={styles.fitbingCircle}>
                <Text style={styles.fitbingCircleText}>87%</Text>
              </View>
            </View>

            <View style={styles.fitbingAdvice}>
              <Text style={styles.fitbingAdviceText}>
                최근 3개월간 호흡기 관련 증상이 15% 감소했습니다. 현재 상태는
                매우 안정적입니다.
              </Text>
            </View>

            <Text style={styles.fitbingLegal}>
              본 정보는 참고용이며 정확한 진단은 전문의와 상담하세요. (의료법
              제27조 준수)
            </Text>
          </View>

          <View style={styles.alarmCard}>
            <View>
              <View style={styles.alarmTitleRow}>
                <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
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
                <Text style={styles.alarmTitle}>복약 알림 설정</Text>
              </View>
              <Text style={styles.alarmSubtitle}>약 복용 주기 설정</Text>
            </View>

            <View style={styles.dosageBtns}>
              {(["3", "2", "custom"] as const).map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.dosageBtn,
                    dosage === d && styles.dosageBtnActive,
                  ]}
                  onPress={() => setDosage(d)}
                >
                  <Text
                    style={[
                      styles.dosageBtnText,
                      dosage === d && styles.dosageBtnTextActive,
                    ]}
                  >
                    {d === "3"
                      ? "1일 3회"
                      : d === "2"
                        ? "1일 2회"
                        : "수기 입력"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View>
              <Text style={styles.pushLabel}>푸시 알림 설정</Text>
              {[
                {
                  key: "feedback" as const,
                  title: "피드백 루프 푸시 알림",
                  sub: "열 내렸나요? 발진 생겼나요?",
                },
                {
                  key: "sideEffect" as const,
                  title: "부작용 감지 푸시 알림",
                  sub: "이상 증상 감지 시 알림 (참고용)",
                },
                {
                  key: "hospital" as const,
                  title: "병원 재방문 추천 알림",
                  sub: "증상 지속 시 병원 재방문 안내",
                },
              ].map((item) => (
                <View key={item.key} style={styles.alarmItem}>
                  <View>
                    <Text style={styles.alarmItemTitle}>{item.title}</Text>
                    <Text style={styles.alarmItemSub}>{item.sub}</Text>
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
          </View>

          <View style={styles.nearbyCard}>
            <View style={styles.nearbyTitle}>
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
              <Text style={styles.nearbyTitleText}>가까운 일반 병원</Text>
            </View>
            <View style={styles.nearbyHospBox}>
              <View style={styles.nearbyHospTop}>
                <View style={styles.nearbyOpenBadge}>
                  <Text style={styles.nearbyOpenBadgeText}>영업중</Text>
                </View>
                <Text style={styles.nearbyHospName}>서울 연세 이비인후과</Text>
              </View>
              <Text style={styles.nearbyHospMeta}>
                450m · 강남구 · 09:00 ~ 18:00
              </Text>
              <View style={styles.nearbyBtns}>
                <TouchableOpacity style={styles.nearbyBtnReserve}>
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
                  <Text style={styles.nearbyBtnReserveText}>예약하기</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.nearbyBtnNav}
                  onPress={() =>
                    Linking.openURL(
                      "https://map.naver.com/v5/search/서울연세이비인후과",
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
                  <Text style={styles.nearbyBtnNavText}>네이버지도</Text>
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity style={styles.moreHospBtn}>
              <Text style={styles.moreHospBtnText}>🏥 주변 병원 더보기</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default FitBingPage;
