# MacTube

YouTube'ga o'xshash React (Vite) sayti.

## Ishga tushirish

1. Node.js o'rnatilganini tekshiring: `node -v` (18 yoki yuqori bo'lsin)
2. Papkaga kiring va paketlarni o'rnating:
   ```bash
   cd mactube
   npm install
   ```
3. `.env.example` faylini nusxalab `.env` deb nomlang va API kalitingizni yozing:
   ```
   VITE_YT_API_KEY=sizning_api_kalitingiz
   ```
   Kalit bo'lmasa ham sayt namunaviy videolar bilan ishlaydi.
4. Serverni ishga tushiring:
   ```bash
   npm run dev
   ```
5. Brauzerda `http://localhost:5173` oching.

## API kalit olish

1. https://console.cloud.google.com da loyiha yarating.
2. APIs & Services → Library → **YouTube Data API v3** ni yoqing.
3. Credentials → Create credentials → API key.

## Loyiha tuzilmasi

- `src/api.js` — YouTube API bilan ishlash
- `src/App.jsx` — asosiy komponentlar (header, menyu, video kartalar, video sahifasi)
- `src/App.css` — dizayn (qorong'i mavzu)
