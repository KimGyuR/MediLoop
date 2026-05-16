import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Path, Svg } from "react-native-svg";

const Header: React.FC = () => {
  return (
    <View style={styles.header}>
      <Text style={styles.logo}>Mediloop</Text>
      <TouchableOpacity style={styles.bellBtn} accessibilityLabel="알림">
        <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <Path
            d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
            stroke="#5DCAA5"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M13.73 21a2 2 0 0 1-3.46 0"
            stroke="#5DCAA5"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
        <View style={styles.bellDot} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
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
    width: 8,
    height: 8,
    backgroundColor: "#E24B4A",
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#f5faf8",
  },
});

export default Header;
