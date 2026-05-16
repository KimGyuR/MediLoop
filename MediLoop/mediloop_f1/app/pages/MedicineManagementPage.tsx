import React from "react";
import { ScrollView, Text, View } from "react-native";
import { Path, Svg } from "react-native-svg";
import { styles } from "../../styles/medicine";

const MedicineManagementPage: React.FC = () => {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.medicineCard}>
        <View style={styles.medicineTitleRow}>
          <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <Path
              d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
              stroke="#5DCAA5"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <Text style={styles.medicineTitleText}>생활 습관 및 주의사항</Text>
        </View>
        <View style={styles.medicineHabitBox}>
          <Text style={styles.medicineHabitTitle}>추천 생활습관</Text>
          <Text style={styles.medicineHabitContent}>
            충분한 수면, 실내 습도 50% 유지, 수분 섭취 1.5L 이상
          </Text>
        </View>
        <View style={styles.medicineWarningBox}>
          <Text style={styles.medicineWarningTitle}>주의해야 할 음식</Text>
          <Text style={styles.medicineWarningContent}>
            자극적인 음식, 카페인, 음주 절대 금지
          </Text>
        </View>
        <View style={styles.medicineCriticalBox}>
          <Text style={styles.medicineCriticalTitle}>CRITICAL WARNING</Text>
          <Text style={styles.medicineCriticalContent}>
            아세트아미노펜 복용 중 음주는 간 손상의 치명적인 원인이 될 수
            있습니다.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default MedicineManagementPage;
