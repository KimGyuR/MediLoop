import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/Header";
import { Hospital } from "../../types";
import HospitalPage from "../pages/HospitalPage";
import ReservationPage from "../pages/ReservationPage";

export default function HospitalTab() {
  const [reservationHospital, setReservationHospital] =
    useState<Hospital | null>(null);

  if (reservationHospital) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <ReservationPage
          hospital={reservationHospital}
          onBack={() => setReservationHospital(null)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <HospitalPage onReserve={setReservationHospital} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5faf8",
  },
});
