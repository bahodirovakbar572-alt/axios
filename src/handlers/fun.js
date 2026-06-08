const axios = require("axios");

// 🎱 Sehrli shar (8ball)
const BALL_ANSWERS = [
  "Ha, albatta! ✅",
  "Shubhasiz! 🌟",
  "Bunga ishonch bilan ayta olaman: HA! 💯",
  "Menimcha, ha 🤔",
  "Kelajak noaniq... 🌫️",
  "Hozir javob berish qiyin 🤷",
  "Yo'q, ehtimol 🚫",
  "Bunga umid qilmang ❌",
  "Qat'iy yo'q! 🛑",
  "Yulduzlar bunga qarshi ⭐",
];

// 🔮 Kunlik taqdir
const FORTUNES = [
  "Bugun omad kuningiz! Biror yangi narsa sinab ko'ring 🍀",
  "Sabr — oltin. Bugun shoshilmang ⏳",
  "Ajoyib yangilik kutilmoqda 📬",
  "Biror do'stingizga qo'ng'iroq qiling — u sizni kutmoqda 📞",
  "Bugun pul masalalari hal bo'ladi 💰",
  "Yangi tanishlik hayotingizni o'zgartirishi mumkin 🤝",
  "Dam oling, energiya to'lang 🧘",
  "Ijodiy kun! G'oyalaringizni yozing ✍️",
];

// 💘 Sevgi foizi
function loveMeter(name1, name2) {
  const str = (name1 + name2).toLowerCase();
  let hash = 0;
  for (const c of str) hash = (hash * 31 + c.charCodeAt(0)) % 101;
  return hash;
}

// 🎭 Sifat generatori
const ADJECTIVES = [
  "🧠 Aqlli", "😎 Zo'r", "🦸 Qahramon", "🌙 Sirli", "🔥 Issiq", "🧊 Sovuq",
  "😂 Kulgili", "💪 Kuchli", "🌺 Chiroyli", "🎯 Aniq", "🌈 Rangli", "⚡ Tezkor",
];

// 🐾 Hayvon
const ANIMALS = [
  "🦁 Sher", "🐺 Bo'ri", "🦊 Tulki", "🦅 Burgut", "🐬 Delfin",
  "🐉 Ajdaho", "🦋 Kapalak", "🐆 Qoplon", "🦄 Yagona shox",
];

async function handleFun(ctx) {
  const msg = ctx.message;
  if (!msg?.text) return;

  const text = msg.text;
  const args = text.split(" ").slice(1).join(" ");
  const from = msg.from.first_name;

  // 🎱 /8ball savol
  if (text.startsWith("/8ball")) {
    if (!args) return ctx.reply("Savol bering: /8ball Bugun yaxshi kun bo'ladimi?");
    const answer = BALL_ANSWERS[Math.floor(Math.random() * BALL_ANSWERS.length)];
    return ctx.reply(`🎱 *Savol:* ${args}\n\n*Javob:* ${answer}`, { parse_mode: "Markdown" });
  }

  // 🔮 /fortune
  if (text.startsWith("/fortune")) {
    const fortune = FORTUNES[Math.floor(Math.random() * FORTUNES.length)];
    return ctx.reply(`🔮 *${from} uchun taqdir:*\n\n${fortune}`, { parse_mode: "Markdown" });
  }

  // 💘 /love @ism1 @ism2
  if (text.startsWith("/love")) {
    const parts = args.split(" ");
    const n1 = parts[0]?.replace("@", "") || from;
    const n2 = parts[1]?.replace("@", "") || "sevgilisi";
    const percent = loveMeter(n1, n2);
    const bar = "❤️".repeat(Math.floor(percent / 10)) + "🖤".repeat(10 - Math.floor(percent / 10));
    return ctx.reply(
      `💘 *Sevgi o'lchagich*\n\n${n1} ❤️ ${n2}\n\n${bar}\n*${percent}%*`,
      { parse_mode: "Markdown" }
    );
  }

  // 🎭 /whoami
  if (text.startsWith("/whoami")) {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    return ctx.reply(
      `🎭 *${from}*, bugun siz:\n\n${adj} ${animal}!`,
      { parse_mode: "Markdown" }
    );
  }

  // 🎲 /dice
  if (text.startsWith("/dice")) {
    const sides = parseInt(args) || 6;
    const result = Math.floor(Math.random() * sides) + 1;
    return ctx.reply(`🎲 ${sides} qirrali zar: *${result}*`, { parse_mode: "Markdown" });
  }

  // 🪙 /flip
  if (text.startsWith("/flip")) {
    const result = Math.random() > 0.5 ? "🦅 Orel!" : "🪙 Reshka!";
    return ctx.reply(result);
  }

  // 📊 /rate [narsa]
  if (text.startsWith("/rate")) {
    if (!args) return ctx.reply("/rate [narsa] — narsani baholang!");
    const score = Math.floor(Math.random() * 11);
    const stars = "⭐".repeat(score) + "☆".repeat(10 - score);
    return ctx.reply(
      `📊 *${args}* baholandi:\n\n${stars}\n*${score}/10*`,
      { parse_mode: "Markdown" }
    );
  }

  // 🤖 /ai savol — bu AI handleriga o'tkaziladi, bu yerda emas
}

module.exports = { handleFun };
