import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  header: {
    backgroundColor: "#f5faf8",
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111",
  },
  bellBtn: {
    position: "relative",
    padding: 2,
  },
  bellDot: {
    position: "absolute",
    top: 0,
    right: 0,
    minWidth: 14,
    height: 14,
    backgroundColor: "#E24B4A",
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: "#f5faf8",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  bellDotText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "700",
  },
});
