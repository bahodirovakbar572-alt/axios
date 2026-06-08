// So'kinish va taqiqlangan so'zlar ro'yxati
// Oila a'zolariga tegishli so'kinishlar (permanent mute)
const FAMILY_SWEARS = [
  "onasin", "onangni", "opangni", "singlini", "xotiningni",
  "otangni", "akangni", "ukangni",
  "mamani", "papani", "blyad", "suka", "pizda",
  // Rus tilidagi oila so'kinishlari
  "мамку", "матери", "сука", "пизда"
];

// Oddiy so'kinishlar (xabarni o'chirish)
const REGULAR_SWEARS = [
  "xar", "harom", "ahmoq", "tentak", "eshak",
  "idiot", "durak", "блять", "ёбаный", "хуй", "залупа",
  "pidar", "gey", "лох"
];

// Reklama aniqlash pattern-lari
const SPAM_PATTERNS = [
  /t\.me\/[a-zA-Z0-9_]+/gi,
  /https?:\/\/[^\s]+/gi,
  /заработ(ок|ать)/gi,
  /подписывайтесь/gi,
  /продам|sotiladi|sotaman/gi,
  /daromad|заработок|topish/gi,
  /100%\s*(foiz|фойда|profit)/gi,
  /ish\s*taklifi|работа\s*есть/gi,
];

module.exports = { FAMILY_SWEARS, REGULAR_SWEARS, SPAM_PATTERNS };
