import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  // DİKKAT: Google Play'e ilk yüklemeden SONRA değiştirilemez. Yayından önce kendi alan adına göre belirle.
  appId: 'com.diniquiz.app',
  appName: 'DiniQuiz',
  webDir: 'dist',
  server: {
    // Uygulama içi sayfalar https://localhost altında açılır (backend CORS_ALLOWED_ORIGINS'te olmalı).
    androidScheme: 'https',
  },
  android: {
    backgroundColor: '#F7F5FF',
  },
}

export default config
