import { styles } from "@/styles/header";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Path, Svg } from "react-native-svg";

type Props = {
  unreadCount?: number;
  onNotificationPress?: () => void;
};

const Header: React.FC<Props> = ({ unreadCount = 0, onNotificationPress }) => {
  return (
    <View style={styles.header}>
      <Text style={styles.logo}>Mediloop</Text>
      <TouchableOpacity
        style={styles.bellBtn}
        accessibilityLabel="알림"
        onPress={onNotificationPress}
      >
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
        {unreadCount > 0 && (
          <View style={styles.bellDot}>
            {unreadCount > 1 && (
              <Text style={styles.bellDotText}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default Header;
