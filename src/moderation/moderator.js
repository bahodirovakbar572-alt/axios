const { FAMILY_SWEARS, REGULAR_SWEARS, SPAM_PATTERNS } = require("./wordlist");

// Muteda bo'lgan foydalanuvchilar: { chatId: { userId: muteUntil } }
const mutedUsers = {};

function isMuted(chatId, userId) {
  const now = Date.now();
  const mute = mutedUsers[chatId]?.[userId];
  return mute && mute > now;
}

function setMute(chatId, userId, durationMs) {
  if (!mutedUsers[chatId]) mutedUsers[chatId] = {};
  mutedUsers[chatId][userId] = durationMs === Infinity ? Infinity : Date.now() + durationMs;
}

function containsFamilySwear(text) {
  const lower = text.toLowerCase();
  return FAMILY_SWEARS.some((word) => lower.includes(word));
}

function containsSwear(text) {
  const lower = text.toLowerCase();
  return REGULAR_SWEARS.some((word) => lower.includes(word));
}

function containsSpam(text) {
  return SPAM_PATTERNS.some((pattern) => pattern.test(text));
}

async function handleModeration(ctx, next) {
  const msg = ctx.message;
  if (!msg || !msg.text) return next();

  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;
  const isGroup = msg.chat.type === "group" || msg.chat.type === "supergroup";

  if (!isGroup) return next();

  // Bot adminmi tekshirish
  let botIsAdmin = false;
  try {
    const botMember = await ctx.telegram.getChatMember(chatId, ctx.botInfo.id);
    botIsAdmin = ["administrator", "creator"].includes(botMember.status);
  } catch {
    return next();
  }

  // Muted foydalanuvchi yozsa — xabarni o'chir
  if (isMuted(chatId, userId)) {
    if (botIsAdmin) {
      try { await ctx.deleteMessage(); } catch {}
    }
    return;
  }

  // 1. Oila a'zolari haqida so'kinish — permanent mute
  if (containsFamilySwear(text)) {
    setMute(chatId, userId, Infinity);
    if (botIsAdmin) {
      try { await ctx.deleteMessage(); } catch {}
      try {
        await ctx.telegram.restrictChatMember(chatId, userId, {
          permissions: {
            can_send_messages: false,
            can_send_media_messages: false,
            can_send_polls: false,
            can_send_other_messages: false,
          },
        });
      } catch {}
      const name = msg.from.first_name || "Foydalanuvchi";
      await ctx.reply(
        `🔇 *${name}* oila a'zolariga so'kindi — guruhda yozish huquqi doimiy ravishda olib qolindi.`,
        { parse_mode: "Markdown" }
      );
    }
    return;
  }

  // 2. Oddiy so'kinish — xabarni o'chir + ogohlantirish
  if (containsSwear(text)) {
    if (botIsAdmin) {
      try { await ctx.deleteMessage(); } catch {}
      await ctx.reply(
        `⚠️ @${msg.from.username || msg.from.first_name}, so'kinish taqiqlangan! Xabaringiz o'chirildi.`
      );
    }
    return;
  }

  // 3. Spam/reklama — xabarni o'chir + ban
  if (containsSpam(text)) {
    if (botIsAdmin) {
      try { await ctx.deleteMessage(); } catch {}
      try {
        await ctx.telegram.banChatMember(chatId, userId);
      } catch {}
      const name = msg.from.first_name || "Foydalanuvchi";
      await ctx.reply(
        `🚫 *${name}* reklama tarqatdi va guruhdan chiqarildi.`,
        { parse_mode: "Markdown" }
      );
    }
    return;
  }

  return next();
}

module.exports = { handleModeration, isMuted };
