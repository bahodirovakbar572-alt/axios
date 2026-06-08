# 🤖 Telegram Admin Bot

Guruhlar uchun kuchli admin yordamchisi — AI chatbot, avtomatik moderatsiya va o'yinlar.

## ✨ Funksiyalar

### 🛡️ Avtomatik Moderatsiya
- **Oddiy so'kinish** — xabar o'chiriladi + ogohlantirish
- **Oila a'zolariga so'kinish** — doimiy mute + xabar o'chiriladi
- **Reklama/spam** — foydalanuvchi banlanadi + xabar o'chiriladi

### 🧠 AI Chatbot (Claude API)
- `/ai [savol]` — savol bering
- Botni **mention** qiling (`@botusername savol`)
- Botning xabariga **javob** bering

### 🎮 Mafia O'yini
```
/mafia        — yangi o'yin yaratish
/mafia_join   — qo'shilish
/mafia_go     — boshlash (min 4 kishi)
/vote @ism    — kunduz ovoz berish
/kill @ism    — kechasi mafia uchun
/save @ism    — kechasi shifokor uchun
/check @ism   — kechasi detektiv uchun
```

### 🎉 Ko'ngilochar Buyruqlar
```
/8ball [savol]       — sehrli shar
/fortune             — kunlik taqdir
/love @ism1 @ism2    — sevgi o'lchagich
/whoami              — bugungi shaxsiyat
/dice [6/12/20...]   — zar tashlash
/flip                — tanga tashlash
/rate [narsa]        — narsa baholash
```

## 🚀 O'rnatish

### 1. Talablar
- Node.js 18+
- Telegram Bot Token (@BotFather dan)
- Anthropic API Key (claude.ai/settings/billing)

### 2. O'rnatish
```bash
git clone <repo>
cd tg-admin-bot
npm install
```

### 3. .env fayli
```bash
cp .env.example .env
```
`.env` faylini oching va to'ldiring:
```
BOT_TOKEN=123456:ABCdef...
ANTHROPIC_API_KEY=sk-ant-...
```

### 4. Ishga tushirish
```bash
npm start
# yoki development uchun:
npm run dev
```

## ⚙️ Guruhda sozlash

1. Botni guruhga qo'shing
2. **Admin** qilib tayinlang
3. Admin ruxsatlarini bering:
   - ✅ Xabarlarni o'chirish
   - ✅ Foydalanuvchilarni ban/unban qilish
   - ✅ Foydalanuvchilarni restrict qilish (mute)

## 📁 Loyiha tuzilmasi
```
src/
├── index.js              — Asosiy fayl
├── ai/
│   └── chatbot.js        — Claude AI integratsiyasi
├── moderation/
│   ├── moderator.js      — Moderatsiya mantig'i
│   └── wordlist.js       — So'kinishlar va spam ro'yxati
├── games/
│   └── mafia.js          — Mafia o'yini
└── handlers/
    └── fun.js            — Ko'ngilochar buyruqlar
```

## 🔧 Moslashtiruv

### So'z ro'yxatini tahrirlash
`src/moderation/wordlist.js` faylida:
- `FAMILY_SWEARS` — permanent mute uchun so'zlar
- `REGULAR_SWEARS` — xabar o'chirish uchun
- `SPAM_PATTERNS` — regex ban uchun patternlar

### AI shaxsiyatini o'zgartirish
`src/ai/chatbot.js` faylida `system` promptni o'zgartiring.
# axios
