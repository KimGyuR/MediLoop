import React from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/Header";
import ProfilePage from "../pages/ProfilePage";

export default function ProfileTab() {
  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ProfilePage />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5faf8",
  },
});
