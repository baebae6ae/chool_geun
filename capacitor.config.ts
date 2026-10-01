import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.github.baebae6ae.hamsterworklog',
  appName: '햄스터 출근일지',
  webDir: 'dist',
  android: {
    backgroundColor: '#fdf5e8',
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_hamster',
      iconColor: '#c98a55',
    },
  },
};

export default config;
