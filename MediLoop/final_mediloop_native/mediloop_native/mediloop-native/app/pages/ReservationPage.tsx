import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Circle, Path, Polyline, Svg } from "react-native-svg";
import { styles } from "../../styles/reservation";
import { Hospital } from "../../types";

interface ReservationPageProps {
  hospital: Hospital;
  onBack: () => void;
}

const ReservationPage: React.FC<ReservationPageProps> = ({
  hospital,
  onBack,
}) => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.reservationHeader}>
        <Text style={styles.reservationHeaderSub}>예약 완료</Text>
        <Text style={styles.reservationHeaderTitle}>{hospital.name}</Text>
      </View>

      <View style={styles.reservationInfo}>
        <View style={styles.reservationInfoRow}>
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
          <Text style={styles.reservationInfoText}>{hospital.address}</Text>
        </View>

        <View style={styles.reservationInfoRow}>
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
          <Text style={styles.reservationInfoText}>
            {hospital.openingHours}
          </Text>
        </View>

        {hospital.phone && (
          <View style={styles.reservationInfoRow}>
            <Svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <Path
                d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"
                stroke="#5DCAA5"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={styles.reservationInfoText}>{hospital.phone}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.reservationConfirmBtn} onPress={onBack}>
          <Text style={styles.reservationConfirmBtnText}>확인</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default ReservationPage;
