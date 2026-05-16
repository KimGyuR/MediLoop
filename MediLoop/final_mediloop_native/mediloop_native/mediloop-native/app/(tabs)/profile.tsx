import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/Header";
import NotificationPage from "../pages/NotificationPage";
import ProfilePage from "../pages/ProfilePage";

const UNREAD_COUNT = 3;

export default function ProfileTab() {
  const [showNotification, setShowNotification] = useState(false);

  if (showNotification) {
    return <NotificationPage onBack={() => setShowNotification(false)} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        unreadCount={UNREAD_COUNT}
        onNotificationPress={() => setShowNotification(true)}
      />
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
