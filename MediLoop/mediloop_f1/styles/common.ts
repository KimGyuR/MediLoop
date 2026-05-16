import { StyleSheet } from "react-native";

export const colors = {
  primary: "#5DCAA5",
  primaryDark: "#1D9E75",
  primaryLight: "#EAF6F1",
  primaryBg: "#f5faf8",
  emergency: "#E53935",
  emergencyLight: "#FFF0F0",
  emergencyBorder: "#FFCDD2",
  white: "#fff",
  black: "#111",
  gray: "#555",
  grayLight: "#aaa",
  grayBorder: "#e8f5f0",
  textPrimary: "#222",
  textSecondary: "#9DB8B0",
  textMuted: "#bbb",
};

export const styles = StyleSheet.create({
  // 공통 카드
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 0.5,
    borderColor: "#EAF6F1",
    marginBottom: 10,
  },
  // 공통 버튼
  primaryBtn: {
    backgroundColor: "#5DCAA5",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  primaryBtnDisabled: {
    backgroundColor: "#A8DCC9",
  },
  outlineBtn: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#5DCAA5",
  },
  outlineBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#5DCAA5",
  },
  // 공통 배지
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  badgePrimary: {
    backgroundColor: "#EAF6F1",
  },
  badgePrimaryText: {
    fontSize: 10,
    color: "#5DCAA5",
    fontWeight: "600",
  },
  badgeEmergency: {
    backgroundColor: "#FFF0F0",
  },
  badgeEmergencyText: {
    fontSize: 10,
    color: "#E53935",
    fontWeight: "600",
  },
  // 공통 입력창
  input: {
    borderWidth: 1,
    borderColor: "#E0F0EA",
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    color: "#333",
    backgroundColor: "#FAFDFB",
  },
  // 공통 헤더 카드
  gradientCard: {
    backgroundColor: "#5DCAA5",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  gradientCardSub: {
    fontSize: 12,
    color: "#fff",
    opacity: 0.88,
    marginBottom: 4,
  },
  gradientCardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  // 공통 행
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  // 공통 구분선
  divider: {
    height: 0.5,
    backgroundColor: "#F0F0F0",
    marginVertical: 4,
  },
  // 공통 화살표
  arrow: {
    fontSize: 18,
    color: "#C8EDE0",
  },
  // 공통 면책 조항
  disclaimer: {
    fontSize: 10,
    color: "#B0C8C0",
    textAlign: "center",
    marginTop: 4,
  },
});
