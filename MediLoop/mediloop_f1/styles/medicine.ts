import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  medicineCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 0.5,
    borderColor: "#EAF6F1",
    gap: 12,
    marginBottom: 10,
  },
  medicineTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  medicineTitleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
    marginLeft: 5,
  },
  medicineHabitBox: {
    backgroundColor: "#F0FAF5",
    borderRadius: 12,
    padding: 12,
    borderWidth: 0.5,
    borderColor: "#C8EDE0",
  },
  medicineHabitTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1D9E75",
    marginBottom: 6,
  },
  medicineHabitContent: {
    fontSize: 12,
    color: "#2D7A5A",
    lineHeight: 18,
  },
  medicineWarningBox: {
    backgroundColor: "#FFF5F5",
    borderRadius: 12,
    padding: 12,
    borderWidth: 0.5,
    borderColor: "#FFCDD2",
  },
  medicineWarningTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#E53935",
    marginBottom: 6,
  },
  medicineWarningContent: {
    fontSize: 12,
    color: "#C62828",
    lineHeight: 18,
  },
  medicineCriticalBox: {
    backgroundColor: "#FFF0F0",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: "#FFCDD2",
  },
  medicineCriticalTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#E53935",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  medicineCriticalContent: {
    fontSize: 12,
    color: "#C62828",
    lineHeight: 18,
  },
});
