require("dotenv").config();
const { Telegraf } = require("telegraf");
const express = require("express"); // Render Web Service uchun shart!
const { handleModeration } = require("./moderation/moderator");
const { handleFun } = require("./handlers/fun");
const { mafiaStart, handleMafiaCallback } = require("./games/mafia");

if (!process.env.BOT_TOKEN) {
  console.error("❌ Xatolik: .env faylda BOT_TOKEN topilmadi!");
  process.exit(1);
}

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();
const PORT = process.env.PORT || 3000; // Render o'zi avtomat port taqdim etadi

// ─── Render Port Scan'dan o'tish uchun HTTP yo'lak ────────────
app.get("/", (req, res) => {
  res.send({
    status: "online",
    message: "Admin Bot muvaffaqiyatli ishlayapti!",
    timestamp: new Date()
  });
});

// ─── Moderatsiya middleware (Matn va Caption tekshiruvi) ──────
bot.use(async (ctx, next) => {
  if (ctx.message?.text || ctx.message?.caption) {
    await handleModeration(ctx, next);
  } else {
    return next();
  }
});

// ─── Mafia callback handler ───────────────────────────────────
bot.on("callback_query", async (ctx) => {
  const data = ctx.callbackQuery?.data || "";
  if (
    data === "mafia_join" ||
    data === "mafia_go" ||
    data.startsWith("day_vote:") ||
    data.startsWith("night_")
  ) {
    return handleMafiaCallback(ctx);
  }
  await ctx.answerCbQuery().catch(() => {});
});

// ─── Ko'ngilochar buyruqlar (Hammasi joyida) ──────────────────
bot.command("8ball", handleFun);
bot.command("fortune", handleFun);
bot.command("love", handleFun);
bot.command("whoami", handleFun);
bot.command("dice", handleFun);
bot.command("flip", handleFun);
bot.command("rate", handleFun);

// ─── Mafia buyrug'i ───────────────────────────────────────────
bot.command("mafia", mafiaStart);

// ─── /help (To'liq ro'yxat HTML formatda) ──────────────────────
bot.command("help", (ctx) => {
  ctx.reply(
    `🤖 <b>Admin Bot — Buyruqlar</b>\n\n` +
    `🛡️ <b>Moderatsiya (avtomatik)</b>\n` +
    `• So'kinishlar — xabar o'chiriladi\n` +
    `• Oila so'kinishi — doimiy mute\n` +
    `• Reklama — ban\n\n` +
    `🎮 <b>Mafia O'yini</b>\n` +
    `/mafia — o'yin yaratish\n` +
    `Qo'shilish va barcha harakatlar knopkalar orqali!\n\n` +
    `Rollar: 🔫 Mafia • 🕵️ Detektiv • 👨‍⚕️ Shifokor\n` +
    `        🛡️ Bodyguard • 👑 Mayor • 🔪 Maniac • 👤 Aholi\n\n` +
    `🎉 <b>Ko'ngilochar</b>\n` +
    `/8ball [savol] — sehrli shar\n` +
    `/fortune — kunlik taqdir\n` +
    `/love @ism1 @ism2 — sevgi o'lchagich\n` +
    `/whoami — bugungi shaxsiyat\n` +
    `/dice [son] — zar tashlash\n` +
    `/flip — tanga tashlash\n` +
    `/rate [narsa] — narsa baholash`,
    { parse_mode: "HTML" }
  );
});

// ─── /start (Guruh va shaxsiy chat uchun tekshiruv bilan) ─────
bot.start((ctx) => {
  const isGroup = ctx.chat.type === "group" || ctx.chat.type === "supergroup";
  // HTML xatolik bermasligi uchun ismdagi maxsus belgilarni tozalaymiz
  const name = ctx.from?.first_name ? ctx.from.first_name.replace(/</g, "&lt;").replace(/>/g, "&gt;") : "Foydalanuvchi";
  
  if (isGroup) {
    ctx.reply(
      `👋 Salom! Men <b>Admin Bot</b>man.\n\nAdmin qiling — moderatsiya va o'yinlar tayyor!\n\n/help — barcha buyruqlar`,
      { parse_mode: "HTML" }
    );
  } else {
    ctx.reply(
      `👋 Salom, <b>${name}</b>!\n\nMeni guruhingizga qo'shing va admin qiling 🚀\n\n/help — barcha buyruqlar`,
      { parse_mode: "HTML" }
    );
  }
});

// ─── Global xatoliklarni ushlab qolish ─────────────────────────
bot.catch((err, ctx) => {
  console.error(`❌ Bot xatosi [${ctx.updateType}]:`, err);
});

// ─── Server va Botni birgalikda ishga tushirish ───────────────
app.listen(PORT, () => {
  console.log(`🚀 HTTP Server Render portida ochildi: port ${PORT}`);
  
  bot.launch().then(async () => {
    const botSelf = await bot.telegram.getMe().catch(() => ({ username: "Unknown" }));
    console.log(`✅ Bot muvaffaqiyatli ishga tushdi: @${botSelf.username}`);
  }).catch((err) => {
    console.error("💥 Botni Telegramga ulashda xatolik yuz berdi:", err);
  });
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));