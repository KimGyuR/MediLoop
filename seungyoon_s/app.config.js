module.exports = {
  expo: {
    name: 'MediLoop',
    slug: 'seungyoon',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    owner: 'kangseungyun',
    extra: {
      eas: {
        projectId: '2c4462e3-9835-43ea-836f-573795493ac1',
      },
    },
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'Mediloop에서 현재 위치를 바탕으로 가까운 병원을 추천해드리기 위해 위치 정보를 사용합니다.',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: 'com.kangseungyoon.seungyoon',
      permissions: [
        'android.permission.RECORD_AUDIO',
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.READ_MEDIA_IMAGES',
        'android.permission.READ_EXTERNAL_STORAGE',
      ],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      [
        'expo-image-picker',
        {
          photosPermission: 'Mediloop에서 증상 사진을 업로드해 AI 분석에 활용합니다.',
          cameraPermission: 'Mediloop에서 증상 사진을 촬영해 AI 분석에 활용합니다.',
        },
      ],
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'Mediloop에서 현재 위치를 바탕으로 가까운 병원을 추천해드리기 위해 위치 정보를 사용합니다.',
        },
      ],
    ],
  },
};
