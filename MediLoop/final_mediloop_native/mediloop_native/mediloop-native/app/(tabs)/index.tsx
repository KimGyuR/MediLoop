import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/Header";
import { Hospital } from "../../types";
import HomePage from "../pages/HomePage";
import NotificationPage from "../pages/NotificationPage";
import ReservationPage from "../pages/ReservationPage";

const UNREAD_COUNT = 3; // 실제 데이터로 교체

export default function HomeTab() {
  const [reservationHospital, setReservationHospital] =
    useState<Hospital | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  if (showNotification) {
    return <NotificationPage onBack={() => setShowNotification(false)} />;
  }

  if (reservationHospital) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          unreadCount={UNREAD_COUNT}
          onNotificationPress={() => setShowNotification(true)}
        />
        <ReservationPage
          hospital={reservationHospital}
          onBack={() => setReservationHospital(null)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        unreadCount={UNREAD_COUNT}
        onNotificationPress={() => setShowNotification(true)}
      />
      <HomePage onReserve={setReservationHospital} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5faf8",
  },
});
