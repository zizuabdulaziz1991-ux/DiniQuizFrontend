# DiniQuiz — Frontend

DiniQuiz dini bilgi yarışmasının web arayüzü. **Vue 3 + Vite + TypeScript** ile geliştirilmiştir. Gençlere yönelik, canlı renkli, mobil öncelikli bir arayüzdür.

> Ürün kuralları, API sözleşmesi ve tasarım rehberi için: **DiniQuiz Proje Dokümanı**

---

## Özellikler

- Kayıt olmadan hemen oynama
- 5 kategori: Genel İslami İlimler, Siyer, İslam Tarihi, Sahabe Hayatı, Kur'an
- Her ekranda **tek soru**; cevap vermeden sonrakine geçilemez
- Soru başına **30 sn** dairesel sayaç
- Doğru/yanlış geri bildirimi ve puan animasyonu
- Quiz sonunda isim girişi ve **Top 10 skor tablosu**
- Mobil öncelikli, açık ve canlı tema
- Arapça metinler için sağdan sola (RTL) destek

---

## Teknolojiler

| | |
|---|---|
| Framework | Vue 3 (Composition API, `<script setup>`) |
| Derleme | Vite |
| Dil | TypeScript |
| Yönlendirme | Vue Router |
| Durum yönetimi | Pinia |
| HTTP | Axios |
| Stil | Tailwind CSS (özel palet) |
| Yazı tipleri | Nunito (arayüz), Amiri (Arapça) |
| Test | Vitest, Vue Test Utils |
| Kod kalitesi | ESLint, Prettier |

---

## Klasör Yapısı

```
diniquiz-frontend/
├── public/
│   └── favicon.svg
├── src/
│   ├── api/
│   │   ├── client.ts           # Axios örneği, temel URL, token başlığı
│   │   └── quiz.ts             # categories, startSession, getCurrent, answer, result, saveName, leaderboard
│   ├── assets/
│   │   └── styles/main.css     # Tailwind + global stiller
│   ├── components/
│   │   ├── AppButton.vue
│   │   ├── CategoryCard.vue
│   │   ├── TimerRing.vue       # 30 sn dairesel sayaç
│   │   ├── ProgressBar.vue
│   │   ├── ChoiceButton.vue    # A/B/C/D şık butonu (normal/doğru/yanlış durumları)
│   │   ├── ScorePop.vue        # "+138" animasyonu
│   │   └── LeaderboardList.vue
│   ├── views/
│   │   ├── HomeView.vue
│   │   ├── CategoryView.vue
│   │   ├── QuizView.vue
│   │   ├── ResultView.vue
│   │   ├── NameEntryView.vue
│   │   └── LeaderboardView.vue
│   ├── stores/
│   │   └── quiz.ts             # Pinia: oturum, mevcut soru, puan
│   ├── composables/
│   │   └── useCountdown.ts     # Sunucudan gelen remaining_ms ile geri sayım
│   ├── router/index.ts
│   ├── types/api.ts            # API tipleri
│   ├── App.vue
│   └── main.ts
├── .env.example
├── tailwind.config.ts
├── vite.config.ts
├── package.json
└── README.md
```

---

## Kurulum

### 1. Gereksinimler

- Node.js 20+
- Çalışan bir **diniquiz-backend** (varsayılan: `http://localhost:8000`)

### 2. Kurulum ve çalıştırma

```bash
git clone <repo-url> diniquiz-frontend
cd diniquiz-frontend
npm install
cp .env.example .env
npm run dev
```

Uygulama: http://localhost:5173

### 3. Ortam değişkenleri

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_TIME_LIMIT_SECONDS=30
VITE_FEEDBACK_DELAY_MS=1500
```

> Backend'deki `CORS_ALLOWED_ORIGINS` değerine `http://localhost:5173` eklenmiş olmalıdır.

---

## Komutlar

| Komut | Açıklama |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Üretim derlemesi (`dist/`) |
| `npm run preview` | Derlenmiş sürümü yerelde önizleme |
| `npm run test` | Vitest testleri |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

---

## Sayfalar ve Yönlendirme

| Yol | Sayfa | Not |
|---|---|---|
| `/` | Ana ekran | "Başla" ve "Skor Tablosu" |
| `/kategoriler` | Kategori seçimi | 5 renkli kart |
| `/quiz/:sessionId` | Soru ekranı | Aktif oturum yoksa `/kategoriler`'e yönlendirir |
| `/sonuc/:sessionId` | Sonuç | Puan, doğru/yanlış/boş |
| `/isim/:sessionId` | İsim girişi | "Kaydet" / "Geç" |
| `/skor-tablosu` | Skor tablosu | `?kategori=siyer` ile sekme seçilir |

---

## Quiz Akışı (Frontend Mantığı)

```
Kategori seç
  └─> POST /sessions/            → session_id + token  (sessionStorage'a yazılır)
       └─> GET /sessions/{id}/current/   → soru + remaining_ms
            ├─ kullanıcı şık seçer   ─┐
            └─ sayaç 0'a iner         ─┴─> POST /answer/  (süre dolduysa choice_id: null)
                 └─> doğru/yanlış göster (1,5 sn) → is_last ? /sonuc : sonraki soru
```

Önemli kurallar:

1. **Sayaç sadece görseldir.** Gerçek süre sunucudadır. Sayaç, `current/` yanıtındaki `remaining_ms` değerinden başlar; böylece sayfa yenilense de süre doğru devam eder.
2. **Cevap kilidi.** Şık seçildiği anda tüm butonlar devre dışı kalır; çift tıklama ikinci istek göndermez.
3. **Süre dolunca** frontend otomatik olarak `choice_id: null` gönderir.
4. **Geri tuşu.** Quiz sırasında tarayıcının geri tuşu engellenir (`onBeforeRouteLeave` ile "Quizden çıkmak istiyor musun?" onayı). Sunucu zaten geri dönmeye izin vermez.
5. **Token saklama.** `session_id` ve `token` `sessionStorage`'da tutulur; sekme kapanınca silinir.
6. **Puan frontend'de hesaplanmaz**; ekrandaki puan her zaman sunucu yanıtından gelir.
7. **İsimler** `{{ }}` ile metin olarak gösterilir; `v-html` kullanılmaz.

---

## Tema ve Tasarım

Koyu tema **kullanılmaz**. Açık zemin üzerinde canlı renkler kullanılır.

`tailwind.config.ts` içindeki renkler:

```ts
colors: {
  primary:   '#6C5CE7', // canlı mor
  secondary: '#00C2A8', // turkuaz
  accent:    '#FFB020', // ayçiçeği sarısı
  success:   '#22C55E', // doğru
  danger:    '#FF5A6E', // yanlış (mercan)
  bg:        '#F7F5FF', // sayfa zemini
  surface:   '#FFFFFF',
  ink:       '#1E1B4B', // ana metin
  muted:     '#6B6B8D',
  cat: {
    ilimler: '#6C5CE7',
    siyer:   '#FF8A3D',
    tarih:   '#3D8BFF',
    sahabe:  '#00C2A8',
    kuran:   '#22B573',
  },
}
```

> Kategori rengi API'den de (`color` alanı) gelir; kartlarda API'deki değer önceliklidir.

Tasarım kuralları:

- **Mobil öncelikli:** 360px genişlikte sorunsuz görünmeli.
- **Şık butonları:** tam genişlik, en az 56px yükseklik, 14px köşe yuvarlama.
- **Kartlar:** 20px köşe yuvarlama, yumuşak gölge.
- **Sayaç:** 15→6 sn mor/yeşil, 5→0 sn mercan rengi ve hafif titreme.
- **Yazı boyutu:** soru en az 20px, şıklar en az 17px.
- **Arapça metin:** `font-family: Amiri; dir="rtl"`.
- **Animasyonlar:** 150–300 ms; `prefers-reduced-motion` açıksa kapatılır.
- **Erişilebilirlik:** Metin/zemin kontrastı en az 4.5:1, butonlara klavye ile erişim, şıklar için `aria-label`.

---

## Testler

```bash
npm run test
```

Test edilmesi gerekenler:

- `useCountdown`: `remaining_ms`'den başlama ve 0'da olay tetikleme
- `ChoiceButton`: normal / seçili / doğru / yanlış durumları
- Quiz store: bir cevap gönderildikten sonra ikinci gönderimin engellenmesi
- Süre dolunca `choice_id: null` gönderilmesi
- İsim formu doğrulaması (2–20 karakter)

---

## Dağıtım

```bash
npm run build
```

`dist/` klasörü herhangi bir statik barındırma servisine yüklenebilir. SPA olduğu için tüm yollar `index.html`'e yönlendirilmelidir (history mode). Üretimde `VITE_API_BASE_URL` gerçek API adresini göstermelidir.

---

## Mobil Sürüm

Mobil uygulama aynı backend API'sini kullanacaktır. Bu Vue kodunu yeniden kullanmak istenirse **Capacitor** ile Android/iOS paketi üretilebilir; bunun için:

- API çağrıları `src/api/` altında toplu tutulmalı (zaten öyle),
- Tarayıcıya özgü API'ler (ör. `window.history`) composable'lar içinde soyutlanmalı,
- Dokunma hedefleri en az 48×48 px olmalıdır.

---

## İlgili Repo

- **diniquiz-backend** — Django REST API ve PostgreSQL
