import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // 인사 카드
  homeCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "#e8f5f0",
    marginBottom: 10,
  },
  homeGreeting: {
    backgroundColor: "#5DCAA5",
    padding: 16,
    paddingBottom: 18,
  },
  homeGreetingSub: {
    fontSize: 12,
    color: "#fff",
    opacity: 0.88,
    marginBottom: 4,
  },
  homeGreetingTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  homeInputArea: {
    padding: 16,
    gap: 14,
  },
  inputLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  inputLabelText: {
    fontSize: 11,
    color: "#9DB8B0",
  },
  uploadBtn: {
    borderWidth: 1.5,
    borderColor: "#4DC9A0",
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F5FBF8",
  },
  uploadBtnText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1D9E75",
  },
  symptomTextarea: {
    borderWidth: 1,
    borderColor: "#E0F0EA",
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    color: "#333",
    backgroundColor: "#FAFDFB",
    height: 100,
    textAlignVertical: "top",
  },
  diagnoseBtn: {
    backgroundColor: "#5DCAA5",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  diagnoseBtnDisabled: {
    backgroundColor: "#A8DCC9",
  },
  diagnoseBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  diagnoseDisclaimer: {
    fontSize: 10,
    color: "#B0C8C0",
    textAlign: "center",
    marginTop: -6,
  },
});
