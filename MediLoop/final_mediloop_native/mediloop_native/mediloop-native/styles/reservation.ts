import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  reservationHeader: {
    backgroundColor: "#5DCAA5",
    borderRadius: 16,
    padding: 18,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  reservationHeaderSub: {
    fontSize: 12,
    color: "#fff",
    opacity: 0.85,
    marginBottom: 4,
  },
  reservationHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  reservationInfo: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 0.5,
    borderColor: "#EAF6F1",
    gap: 10,
    marginBottom: 10,
  },
  reservationInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 4,
  },
  reservationInfoText: {
    fontSize: 13,
    color: "#555",
    lineHeight: 24,
    marginLeft: 5,
  },
  reservationConfirmBtn: {
    backgroundColor: "#5DCAA5",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  reservationConfirmBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});
