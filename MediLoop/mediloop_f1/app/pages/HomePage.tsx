import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Circle, Line, Path, Svg } from "react-native-svg";
import { styles } from "../../styles/home";
import { Hospital } from "../../types";
import DiagnosisPage from "./DiagnosisPage";

interface HomePageProps {
  onReserve: (hospital: Hospital) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onReserve }) => {
  const [symptomText, setSymptomText] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const handleDiagnose = async () => {
    if (!symptomText.trim()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setShowResult(true);
    setLoading(false);
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      console.log(result.assets[0].uri);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 인사 + 입력 카드 */}
      <View style={styles.homeCard}>
        <View style={styles.homeGreeting}>
          <Text style={styles.homeGreetingSub}>안녕하세요</Text>
          <Text style={styles.homeGreetingTitle}>오늘 어디가 불편하세요?</Text>
        </View>

        <View style={styles.homeInputArea}>
          {/* 사진 업로드 */}
          <View>
            <View style={styles.inputLabel}>
              <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"
                  stroke="#5DCAA5"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Circle
                  cx="12"
                  cy="13"
                  r="3"
                  stroke="#5DCAA5"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Line
                  x1="12"
                  y1="11"
                  x2="12"
                  y2="9"
                  stroke="#5DCAA5"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <Line
                  x1="11"
                  y1="10"
                  x2="13"
                  y2="10"
                  stroke="#5DCAA5"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </Svg>
              <Text style={styles.inputLabelText}>증상 사진 첨부 (선택)</Text>
            </View>
            <TouchableOpacity
              style={styles.uploadBtn}
              onPress={handlePickImage}
            >
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"
                  stroke="#5DCAA5"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Circle
                  cx="12"
                  cy="13"
                  r="3"
                  stroke="#5DCAA5"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Line
                  x1="12"
                  y1="11"
                  x2="12"
                  y2="9"
                  stroke="#5DCAA5"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <Line
                  x1="11"
                  y1="10"
                  x2="13"
                  y2="10"
                  stroke="#5DCAA5"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </Svg>
              <Text style={styles.uploadBtnText}>사진 업로드</Text>
            </TouchableOpacity>
          </View>

          {/* 텍스트 입력 */}
          <View>
            <View style={styles.inputLabel}>
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
              <Text style={styles.inputLabelText}>증상 직접 입력</Text>
            </View>
            <TextInput
              style={styles.symptomTextarea}
              multiline
              numberOfLines={4}
              value={symptomText}
              onChangeText={setSymptomText}
              placeholder={
                "증상과 기저질환을 자세하게 작성해주세요.\n예) 3월 전부터 두통이 심하고 속이 메스꺼워요."
              }
              placeholderTextColor="#bbb"
            />
          </View>

          {/* AI 진단 버튼 */}
          <TouchableOpacity
            style={[
              styles.diagnoseBtn,
              (loading || !symptomText.trim()) && styles.diagnoseBtnDisabled,
            ]}
            onPress={handleDiagnose}
            disabled={loading || !symptomText.trim()}
          >
            {loading ? (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
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
                <Text style={styles.diagnoseBtnText}>분석 중...</Text>
              </View>
            ) : (
              <Text style={styles.diagnoseBtnText}>AI 자가진단 시작</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.diagnoseDisclaimer}>
            본 결과는 참고용이며 정확한 진단은 의사에게 문의하세요.
          </Text>
        </View>
      </View>

      {/* 분석 결과 */}
      {showResult && (
        <DiagnosisPage
          onBack={() => setShowResult(false)}
          onReserve={onReserve}
        />
      )}
    </ScrollView>
  );
};

export default HomePage;
