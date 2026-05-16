import { Tabs } from "expo-router";
import { Circle, Path, Rect, Svg } from "react-native-svg";

const PRIMARY = "#5DCAA5";
const INACTIVE = "#bbb";

function HomeIcon({ active }: { active: boolean }) {
  const color = active ? PRIMARY : INACTIVE;
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 21V12h6v9"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function HospitalIcon({ active }: { active: boolean }) {
  const color = active ? PRIMARY : INACTIVE;
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 8v8M8 12h8"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FillBagIcon({ active }: { active: boolean }) {
  const color = active ? PRIMARY : INACTIVE;
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 3h6l1 4H8L9 3z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect
        x="4"
        y="7"
        width="16"
        height="14"
        rx="2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 11v6M9 14h6"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  const color = active ? PRIMARY : INACTIVE;
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Circle
        cx="12"
        cy="8"
        r="4"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopColor: "#e0eeea",
          borderTopWidth: 0.5,
          paddingBottom: 20,
          paddingTop: 8,
          height: 70,
        },
        tabBarActiveTintColor: PRIMARY,
        tabBarInactiveTintColor: INACTIVE,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => <HomeIcon active={focused} />,
        }}
      />
      <Tabs.Screen
        name="hospital"
        options={{
          title: "Hospital",
          tabBarIcon: ({ focused }) => <HospitalIcon active={focused} />,
        }}
      />
      <Tabs.Screen
        name="fillbag"
        options={{
          title: "Fill Bag",
          tabBarIcon: ({ focused }) => <FillBagIcon active={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => <ProfileIcon active={focused} />,
        }}
      />
    </Tabs>
  );
}
