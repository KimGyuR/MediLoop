import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/Header";
import FitBingPage from "../pages/FitBingPage";

export default function FillBagTab() {
  const [activeTab, setActiveTab] = useState<"consult" | "medicine">("consult");

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      {/* 고정 탭 버튼 */}
      <View style={styles.tabBar}>
        <View style={styles.tabBarInner}>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === "consult" && styles.tabBtnActive,
            ]}
            onPress={() => setActiveTab("consult")}
          >
            <Text
              style={[
                styles.tabBtnText,
                activeTab === "consult" && styles.tabBtnTextActive,
              ]}
            >
              상담 및 처방전
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === "medicine" && styles.tabBtnActive,
            ]}
            onPress={() => setActiveTab("medicine")}
          >
            <Text
              style={[
                styles.tabBtnText,
                activeTab === "medicine" && styles.tabBtnTextActive,
              ]}
            >
              약 관리
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.content}>
        <FitBingPage activeTab={activeTab} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5faf8",
  },
  tabBar: {
    backgroundColor: "#f5faf8",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tabBarInner: {
    backgroundColor: "#F5FBF8",
    borderRadius: 12,
    padding: 4,
    flexDirection: "row",
    gap: 4,
    borderWidth: 0.5,
    borderColor: "#EAF6F1",
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  tabBtnActive: {
    backgroundColor: "#5DCAA5",
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9DB8B0",
  },
  tabBtnTextActive: {
    color: "#fff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 4,
  },
});
