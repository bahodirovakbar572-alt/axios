// ═══════════════════════════════════════════════════════
//  MAFIA O'YINI — inline keyboard + DM harakatlar
// ═══════════════════════════════════════════════════════

const ROLES = {
  MAFIA:      { id: "MAFIA",      icon: "🔫", name: "Mafia",      team: "mafia"    },
  DETECTIVE:  { id: "DETECTIVE",  icon: "🕵️", name: "Detektiv",   team: "citizen"  },
  DOCTOR:     { id: "DOCTOR",     icon: "👨‍⚕️", name: "Shifokor",  team: "citizen"  },
  BODYGUARD:  { id: "BODYGUARD",  icon: "🛡️", name: "Bodyguard",  team: "citizen"  },
  MAYOR:      { id: "MAYOR",      icon: "👑", name: "Mayor",      team: "citizen"  },
  MANIAC:     { id: "MANIAC",     icon: "🔪", name: "Maniac",     team: "maniac"   },
  CITIZEN:    { id: "CITIZEN",    icon: "👤", name: "Oddiy aholi", team: "citizen" },
};

// Nechta o'yinchiga qaysi rollar
// [mafia_count, has_detective, has_doctor, has_bodyguard, has_mayor, has_maniac]
function getRoleSet(count) {
  if (count <= 4)  return ["MAFIA", "DETECTIVE", "DOCTOR", "CITIZEN"];
  if (count <= 6)  return ["MAFIA", "DETECTIVE", "DOCTOR", "BODYGUARD", "CITIZEN", "CITIZEN"];
  if (count <= 8)  return ["MAFIA", "MAFIA", "DETECTIVE", "DOCTOR", "BODYGUARD", "MAYOR", "CITIZEN", "CITIZEN"];
  if (count <= 10) return ["MAFIA", "MAFIA", "DETECTIVE", "DOCTOR", "BODYGUARD", "MAYOR", "MANIAC", "CITIZEN", "CITIZEN", "CITIZEN"];
  // 11+
  const roles = ["MAFIA", "MAFIA", "MAFIA", "DETECTIVE", "DOCTOR", "BODYGUARD", "MAYOR", "MANIAC"];
  while (roles.length < count) roles.push("CITIZEN");
  return roles;
}

const games = {};

function getGame(chatId) { return games[chatId]; }

// ─── Lobby ────────────────────────────────────────────────────
async function mafiaStart(ctx) {
  const chatId = ctx.chat.id;
  if (!["group", "supergroup"].includes(ctx.chat.type)) {
    return ctx.reply("Bu buyruq faqat guruhda ishlaydi!");
  }
  if (games[chatId]?.phase === "lobby") {
    return ctx.reply("O'yin allaqachon kutmoqda! Qo'shilish tugmasini bosing 👇");
  }

  games[chatId] = {
    phase: "lobby",
    players: {},
    votes: {},
    nightActions: {},
    round: 0,
    lobbyMsgId: null,
    creatorId: ctx.from.id,
  };

  const game = games[chatId];
  const userId = ctx.from.id;
  const name = ctx.from.first_name;
  game.players[userId] = { name, role: null, alive: true, username: ctx.from.username };

  const sent = await ctx.reply(buildLobbyText(game), {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "✋ O'yinga qo'shilish", callback_data: "mafia_join" }],
        [{ text: "🚀 O'yinni boshlash", callback_data: "mafia_go" }],
      ],
    },
  });
  game.lobbyMsgId = sent.message_id;
}

function buildLobbyText(game) {
  const list = Object.values(game.players)
    .map((p, i) => `${i + 1}. ${p.name}`)
    .join("\n");
  const count = Object.keys(game.players).length;
  return `🎮 *Mafia o'yini — Lobby*\n\nO'yinchilar (${count}):\n${list}\n\nKamida 4 kishi kerak. Tayyor bo'lsangiz "O'yinni boshlash" ni bosing!`;
}

async function mafiaJoin(ctx) {
  const chatId = ctx.chat.id;
  const game = getGame(chatId);
  if (!game || game.phase !== "lobby") return ctx.answerCbQuery("O'yin mavjud emas.");

  const userId = ctx.from.id;
  if (game.players[userId]) return ctx.answerCbQuery("Siz allaqachon ro'yxatdasiz!");

  game.players[userId] = {
    name: ctx.from.first_name,
    username: ctx.from.username,
    role: null,
    alive: true,
  };

  await ctx.answerCbQuery("✅ Qo'shildingiz!");
  await ctx.editMessageText(buildLobbyText(game), {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "✋ O'yinga qo'shilish", callback_data: "mafia_join" }],
        [{ text: "🚀 O'yinni boshlash", callback_data: "mafia_go" }],
      ],
    },
  });
}

async function mafiaGo(ctx) {
  const chatId = ctx.chat.id;
  const game = getGame(chatId);
  if (!game || game.phase !== "lobby") return ctx.answerCbQuery("O'yin topilmadi.");
  if (ctx.from.id !== game.creatorId) return ctx.answerCbQuery("Faqat o'yin yaratuvchi boshlashi mumkin!");

  const count = Object.keys(game.players).length;
  if (count < 4) return ctx.answerCbQuery("Kamida 4 kishi kerak!");

  await ctx.answerCbQuery("O'yin boshlanmoqda...");
  await startGame(ctx, game, chatId);
}

async function startGame(ctx, game, chatId) {
  // Rollarni taqsimlash
  const playerIds = Object.keys(game.players);
  const roleSet = getRoleSet(playerIds.length);
  const shuffled = [...roleSet].sort(() => Math.random() - 0.5);
  playerIds.forEach((id, i) => {
    game.players[id].role = shuffled[i];
  });

  game.phase = "day";
  game.round = 1;

  // Har bir o'yinchiga DM orqali rol yuborish
  for (const [userId, player] of Object.entries(game.players)) {
    const role = ROLES[player.role];
    const desc = getRoleDesc(player.role);
    try {
      await ctx.telegram.sendMessage(
        userId,
        `🎭 *O'yin boshlandi!*\n\nSizning rolingiz: ${role.icon} *${role.name}*\n\n${desc}`,
        { parse_mode: "Markdown" }
      );
    } catch {
      // DM yopiq bo'lsa
    }
  }

  const playerList = Object.values(game.players)
    .map((p, i) => `${i + 1}. ${p.name}`)
    .join("\n");

  await ctx.telegram.sendMessage(
    chatId,
    `☀️ *1-kun boshlandi!*\n\nO'yinchilar:\n${playerList}\n\nHar kimga shaxsiy xabarda roli yuborildi.\nMuhokama qiling — kimni chiqarmoqchisiz?`,
    { parse_mode: "Markdown" }
  );

  await sendVoteMessage(ctx, game, chatId);
}

// ─── Kunduz ovoz berish ───────────────────────────────────────
async function sendVoteMessage(ctx, game, chatId) {
  game.phase = "voting";
  game.votes = {};

  const buttons = getAlivePlayerButtons(game, "day_vote");
  await ctx.telegram.sendMessage(
    chatId,
    `🗳️ *Ovoz berish!*\n\nKimni chiqaramiz? Har kim bir ovoz beradi:`,
    {
      parse_mode: "Markdown",
      reply_markup: { inline_keyboard: buttons },
    }
  );
}

function getAlivePlayerButtons(game, prefix) {
  const alive = Object.entries(game.players).filter(([, p]) => p.alive);
  const buttons = alive.map(([id, p]) => [{
    text: `${p.name}`,
    callback_data: `${prefix}:${id}`,
  }]);
  return buttons;
}

async function handleDayVote(ctx, targetId) {
  const chatId = ctx.chat.id;
  const game = getGame(chatId);
  if (!game || game.phase !== "voting") return ctx.answerCbQuery("Hozir ovoz berish vaqti emas.");

  const voterId = ctx.from.id;
  if (!game.players[voterId]?.alive) return ctx.answerCbQuery("Siz o'yinda yo'qsiz.");
  if (!game.players[targetId]) return ctx.answerCbQuery("Bu o'yinchi topilmadi.");
  if (game.votes[voterId]) return ctx.answerCbQuery("Siz allaqachon ovoz berdingiz!");

  // Mayor: 2 ta ovoz beradi
  const voteWeight = game.players[voterId].role === "MAYOR" ? 2 : 1;
  game.votes[voterId] = { targetId, weight: voteWeight };

  await ctx.answerCbQuery(`✅ ${game.players[targetId].name} uchun ovoz berdingiz`);

  const aliveCount = Object.values(game.players).filter(p => p.alive).length;
  const votedCount = Object.keys(game.votes).length;

  await ctx.telegram.sendMessage(
    chatId,
    `✅ *${ctx.from.first_name}* → *${game.players[targetId].name}* (${votedCount}/${aliveCount})`,
    { parse_mode: "Markdown" }
  );

  if (votedCount >= aliveCount) {
    await processDayVotes(ctx, game, chatId);
  }
}

async function processDayVotes(ctx, game, chatId) {
  const tally = {};
  for (const { targetId, weight } of Object.values(game.votes)) {
    tally[targetId] = (tally[targetId] || 0) + weight;
  }

  const maxVotes = Math.max(...Object.values(tally));
  const topCandidates = Object.entries(tally).filter(([, v]) => v === maxVotes);

  let eliminated = null;
  if (topCandidates.length === 1) {
    eliminated = topCandidates[0][0];
    game.players[eliminated].alive = false;
    const p = game.players[eliminated];
    const role = ROLES[p.role];
    await ctx.telegram.sendMessage(
      chatId,
      `☠️ *${p.name}* (${role.icon} ${role.name}) guruhdan chiqarildi!`,
      { parse_mode: "Markdown" }
    );
  } else {
    await ctx.telegram.sendMessage(chatId, `🤝 Ovozlar teng — hech kim chiqarilmadi!`);
  }

  const winner = checkWin(game);
  if (winner) return announceWinner(ctx, chatId, game, winner);

  await startNight(ctx, game, chatId);
}

// ─── Kecha ────────────────────────────────────────────────────
async function startNight(ctx, game, chatId) {
  game.phase = "night";
  game.nightActions = {};
  game.round++;

  await ctx.telegram.sendMessage(
    chatId,
    `🌙 *${game.round}-kecha boshlandi!*\n\nBotdan shaxsiy xabar kuting — har kim o'z harakatini bajaradi.`,
    { parse_mode: "Markdown" }
  );

  // Har bir rolga DM yuborish
  for (const [userId, player] of Object.entries(game.players)) {
    if (!player.alive) continue;
    await sendNightAction(ctx, game, chatId, userId, player);
  }
}

async function sendNightAction(ctx, game, chatId, userId, player) {
  const role = player.role;
  const buttons = getAlivePlayerButtons(game, `night_${role}_${chatId}`);

  const messages = {
    MAFIA:      "🔫 Kimni o'ldiramiz? Tanlang:",
    DETECTIVE:  "🕵️ Kimni tekshirasiz?",
    DOCTOR:     "👨‍⚕️ Kimni davolayman (o'lishdan saqlayman)?",
    BODYGUARD:  "🛡️ Kimni himoya qilaman (mafiyadan saqlayman)?",
    MANIAC:     "🔪 Qurbonni tanlang:",
    MAYOR:      null,
    CITIZEN:    null,
  };

  const msg = messages[role];
  if (!msg) return;

  try {
    await ctx.telegram.sendMessage(userId, `🌙 *Kecha ${game.round}*\n\n${msg}`, {
      parse_mode: "Markdown",
      reply_markup: { inline_keyboard: buttons },
    });
  } catch {
    // DM yopiq
  }
}

async function handleNightAction(ctx, role, chatId, targetId) {
  const game = getGame(chatId);
  if (!game || game.phase !== "night") return ctx.answerCbQuery("Hozir kecha emas.");

  const actorId = ctx.from.id;
  const actor = game.players[actorId];
  if (!actor?.alive) return ctx.answerCbQuery("Siz o'yinda yo'qsiz.");
  if (actor.role !== role) return ctx.answerCbQuery("Bu harakat sizga tegishli emas.");
  if (game.nightActions[`${role}_done_${actorId}`]) return ctx.answerCbQuery("Siz allaqachon harakat qildingiz!");

  game.nightActions[`${role}_done_${actorId}`] = true;
  game.nightActions[role] = targetId;

  const targetName = game.players[targetId]?.name || "?";
  await ctx.answerCbQuery(`✅ ${targetName} tanlandi`);
  await ctx.editMessageText(`✅ Tanlov qabul qilindi: *${targetName}*`, { parse_mode: "Markdown" });

  await checkNightEnd(ctx, game, chatId);
}

async function checkNightEnd(ctx, game, chatId) {
  const alive = Object.entries(game.players).filter(([, p]) => p.alive);

  const needMafia     = alive.some(([, p]) => p.role === "MAFIA");
  const needDetective = alive.some(([, p]) => p.role === "DETECTIVE");
  const needDoctor    = alive.some(([, p]) => p.role === "DOCTOR");
  const needBodyguard = alive.some(([, p]) => p.role === "BODYGUARD");
  const needManiac    = alive.some(([, p]) => p.role === "MANIAC");

  const mafiaActed     = !needMafia     || game.nightActions["MAFIA"]     !== undefined;
  const detectiveActed = !needDetective || game.nightActions["DETECTIVE"] !== undefined;
  const doctorActed    = !needDoctor    || game.nightActions["DOCTOR"]    !== undefined;
  const bodyguardActed = !needBodyguard || game.nightActions["BODYGUARD"] !== undefined;
  const maniacActed    = !needManiac    || game.nightActions["MANIAC"]    !== undefined;

  if (!mafiaActed || !detectiveActed || !doctorActed || !bodyguardActed || !maniacActed) return;

  await resolveNight(ctx, game, chatId);
}

async function resolveNight(ctx, game, chatId) {
  const na = game.nightActions;
  const messages = [];

  // Mafia o'ldiradi
  let mafiaKillTarget = na["MAFIA"];
  // Bodyguard himoya qiladi (mafiyadan)
  if (mafiaKillTarget && na["BODYGUARD"] === mafiaKillTarget) {
    messages.push(`🛡️ Bodyguard kimnidir o'limdan qutqardi!`);
    mafiaKillTarget = null;
  }
  // Shifokor davolaydi
  if (mafiaKillTarget && na["DOCTOR"] === mafiaKillTarget) {
    messages.push(`👨‍⚕️ Shifokor kimnidir o'limdan qutqardi!`);
    mafiaKillTarget = null;
  }
  if (mafiaKillTarget && game.players[mafiaKillTarget]) {
    game.players[mafiaKillTarget].alive = false;
    const p = game.players[mafiaKillTarget];
    messages.push(`🔫 *${p.name}* (${ROLES[p.role].icon} ${ROLES[p.role].name}) kechasi o'ldirildi!`);
  }

  // Maniac o'ldiradi (shifokor va bodyguard ta'sir qilmaydi)
  const maniacTarget = na["MANIAC"];
  if (maniacTarget && game.players[maniacTarget]?.alive) {
    game.players[maniacTarget].alive = false;
    const p = game.players[maniacTarget];
    messages.push(`🔪 *${p.name}* (${ROLES[p.role].icon} ${ROLES[p.role].name}) noma'lum qotil qo'lidan halok bo'ldi!`);
  }

  // Detektiv tekshiradi — faqat o'ziga DM
  const detectiveTarget = na["DETECTIVE"];
  if (detectiveTarget && game.players[detectiveTarget]) {
    const target = game.players[detectiveTarget];
    const isMafia = target.role === "MAFIA";
    const detEntry = Object.entries(game.players).find(([, p]) => p.role === "DETECTIVE" && p.alive);
    if (detEntry) {
      try {
        await ctx.telegram.sendMessage(
          detEntry[0],
          `🕵️ Tekshiruv natijasi:\n*${target.name}* — ${isMafia ? "🔴 MAFIA!" : "🟢 Tinch odam"}`,
          { parse_mode: "Markdown" }
        );
      } catch {}
    }
  }

  const summary = messages.length ? messages.join("\n") : "🌙 Kecha tinch o'tdi — hech kim o'lmadi.";
  await ctx.telegram.sendMessage(chatId, `☀️ *Tong otdi!*\n\n${summary}`, { parse_mode: "Markdown" });

  const winner = checkWin(game);
  if (winner) return announceWinner(ctx, chatId, game, winner);

  await sendVoteMessage(ctx, game, chatId);
}

// ─── G'olib aniqlash ──────────────────────────────────────────
function checkWin(game) {
  const alive = Object.values(game.players).filter(p => p.alive);
  const mafia    = alive.filter(p => p.role === "MAFIA").length;
  const maniac   = alive.filter(p => p.role === "MANIAC").length;
  const citizens = alive.filter(p => ROLES[p.role].team === "citizen").length;

  if (mafia === 0 && maniac === 0) return "citizen";
  if (mafia >= citizens && maniac === 0) return "mafia";
  if (maniac > 0 && mafia === 0 && citizens === 0) return "maniac";
  return null;
}

async function announceWinner(ctx, chatId, game, winner) {
  const msgs = {
    citizen: "🏆 *Shahar aholisi g'alaba qildi!* Tinchlik qayta tiklandi.",
    mafia:   "🔫 *Mafia g'alaba qildi!* Shahar qorong'ulikka cho'mdi.",
    maniac:  "🔪 *Maniac g'alaba qildi!* Hammani qo'rquvga soldi!",
  };

  const roleList = Object.values(game.players)
    .map(p => `• ${p.name} — ${ROLES[p.role].icon} ${ROLES[p.role].name}`)
    .join("\n");

  await ctx.telegram.sendMessage(
    chatId,
    `${msgs[winner]}\n\n*Barcha rollar:*\n${roleList}`,
    { parse_mode: "Markdown" }
  );

  delete games[chatId];
}

// ─── Rol tavsiflari ───────────────────────────────────────────
function getRoleDesc(role) {
  const desc = {
    MAFIA:     "Kechasi jamoangiz bilan kimnidir o'ldirasiz. Kunduz oddiy aholi bo'lib ko'rinasiz.",
    DETECTIVE: "Kechasi bir kishini tekshirasiz — mafiami yoki yo'q bilib olasiz.",
    DOCTOR:    "Kechasi bir kishini davolaysiz — o'limdan qutqarasiz. O'zingizni ham saqlay olasiz.",
    BODYGUARD: "Kechasi bir kishini himoya qilasiz — mafia unga tega olmaydi.",
    MAYOR:     "👑 Sizning ovozingiz 2 ta hisoblanadi. Kechasi harakatingiz yo'q.",
    MANIAC:    "Yolg'iz o'ynaymiz. Kechasi kimnidir o'ldirasiz. Hamma sizga qarshi!",
    CITIZEN:   "Kunduz muhokamaga qatnashing va mafiyani toping!",
  };
  return desc[role] || "";
}

// ─── Callback query router ────────────────────────────────────
async function handleMafiaCallback(ctx) {
  const data = ctx.callbackQuery?.data;
  if (!data) return;

  if (data === "mafia_join") return mafiaJoin(ctx);
  if (data === "mafia_go")   return mafiaGo(ctx);

  if (data.startsWith("day_vote:")) {
    const targetId = data.split(":")[1];
    return handleDayVote(ctx, targetId);
  }

  // night_ROLE_chatId:targetId
  const nightMatch = data.match(/^night_([A-Z]+)_(-?\d+):(\d+)$/);
  if (nightMatch) {
    const [, role, chatId, targetId] = nightMatch;
    return handleNightAction(ctx, role, chatId, targetId);
  }
}

module.exports = { mafiaStart, handleMafiaCallback };
