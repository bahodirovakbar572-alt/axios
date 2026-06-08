require("dotenv").config();
const { Telegraf } = require("telegraf");
const { handleModeration } = require("./moderation/moderator");
const { handleFun } = require("./handlers/fun");
const { mafiaStart, handleMafiaCallback } = require("./games/mafia");

const bot = new Telegraf(process.env.BOT_TOKEN);

// ─── Moderatsiya middleware ───────────────────────────────────
bot.use(async (ctx, next) => {
  if (ctx.message?.text) {
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
  await ctx.answerCbQuery();
});

// ─── Fun commands ─────────────────────────────────────────────
bot.command("8ball", handleFun);
bot.command("fortune", handleFun);
bot.command("love", handleFun);
bot.command("whoami", handleFun);
bot.command("dice", handleFun);
bot.command("flip", handleFun);
bot.command("rate", handleFun);

// ─── Mafia ────────────────────────────────────────────────────
bot.command("mafia", mafiaStart);

// ─── /help ────────────────────────────────────────────────────
bot.command("help", (ctx) => {
  ctx.reply(
    `🤖 *Admin Bot — Buyruqlar*\n
🛡️ *Moderatsiya (avtomatik)*
• So'kinishlar — xabar o'chiriladi
• Oila so'kinishi — doimiy mute
• Reklama — ban

🎮 *Mafia O'yini*
/mafia — o'yin yaratish
Qo'shilish va barcha harakatlar knopkalar orqali!

Rollar: 🔫 Mafia • 🕵️ Detektiv • 👨‍⚕️ Shifokor
        🛡️ Bodyguard • 👑 Mayor • 🔪 Maniac • 👤 Aholi

🎉 *Ko'ngilochar*
/8ball [savol] — sehrli shar
/fortune — kunlik taqdir
/love @ism1 @ism2 — sevgi o'lchagich
/whoami — bugungi shaxsiyat
/dice [son] — zar tashlash
/flip — tanga tashlash
/rate [narsa] — narsa baholash`,
    { parse_mode: "Markdown" }
  );
});

// ─── /start ───────────────────────────────────────────────────
bot.start((ctx) => {
  const isGroup = ctx.chat.type === "group" || ctx.chat.type === "supergroup";
  if (isGroup) {
    ctx.reply(
      `👋 Salom! Men *Admin Bot*man.\n\nAdmin qiling — moderatsiya va o'yinlar tayyor!\n\n/help — barcha buyruqlar`,
      { parse_mode: "Markdown" }
    );
  } else {
    ctx.reply(
      `👋 Salom, *${ctx.from.first_name}*!\n\nMeni guruhingizga qo'shing va admin qiling 🚀\n\n/help — barcha buyruqlar`,
      { parse_mode: "Markdown" }
    );
  }
});

// ─── Xatolarni ushlab qolish ──────────────────────────────────
bot.catch((err, ctx) => {
  console.error(`Bot xatosi [${ctx.updateType}]:`, err.message);
});

// ─── Ishga tushirish ──────────────────────────────────────────
bot.launch().then(() => {
  console.log(`✅ Bot ishga tushdi: @${bot.botInfo?.username}`);
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
