const ccxt = require("ccxt");
const symbols = require("./symbols2.json");
const TelegramBot = require("node-telegram-bot-api");
const { getData } = require("./dataFetch.js");
require("dotenv").config();

const token = process.env.FOUR_HOUR_BOT;
const bot = new TelegramBot(token, { polling: true });

// Store jobs in a Map to manage multiple chats
const jobs = new Map();

function getText(
  timeframe,
  isMacdDivergence,
  isRsiDivergence,
  isUoDivergence,
  isKdjDivergence
) {
  if (
    !isMacdDivergence &&
    !isRsiDivergence &&
    !isUoDivergence &&
    !isKdjDivergence
  ) {
    return "";
  }

  const arr = [];
  if (isMacdDivergence) {
    arr.push("🚀");
  }
  if (isRsiDivergence) {
    arr.push("R");
  }

  if (isKdjDivergence) {
    arr.push("K");
  }

  if (isUoDivergence) {
    arr.push("U");
  }

  return `[${timeframe}: ${arr.toString()}]`;
}

function getValue(
  isMacdDivergence,
  isRsiDivergence,
  isUoDivergence,
  isKdjDivergence
) {
  return isMacdDivergence + isRsiDivergence + isUoDivergence + isKdjDivergence;
}

async function processSymbol(exchange, symbol) {
  const timeFrame1 = "1h";
  const timeFrame2 = "4h";

  const short = await getData(exchange, symbol, timeFrame1, "short");
  const long = await getData(exchange, symbol, timeFrame2, "long");

  if (short || long) {
    const shortText = short
      ? getText(
          timeFrame1,
          short.isMacdDivergence,
          short.isRsiDivergence,
          short.isUoDivergence,
          short.isKdjDivergence
        )
      : "";
    const longText = long
      ? getText(
          timeFrame2,
          long.isMacdDivergence,
          long.isRsiDivergence,
          long.isUoDivergence,
          long.isKdjDivergence
        )
      : "";

    const trend = short ? short.trend : long ? long.trend : "";
    const value = short
      ? short.bollengerValue
      : long
      ? long.bollengerValue
      : "";

    if (shortText.length === 0 && longText.length === 0) {
      return "";
    }

    return `${
      symbol.split("/")[0]
    } - ${trend} ${longText} ${shortText} ${value}`;
  }

  return "";
}

async function jobFunction(chatId) {
  const exchange = new ccxt.binance({
    options: {
      defaultType: "future", // Set the default type to 'future'
    },
  });

  const ohlcvData = symbols.map((symbol) => processSymbol(exchange, symbol));

  const results = await Promise.all(ohlcvData);
  const filteredResult = results
    .filter((item) => item !== "")
    .sort((a, b) => b.length - a.length);

  if (filteredResult.length !== 0) {
    const response = filteredResult.join("\n");
    bot.sendMessage(chatId, response);
  }
}

// Function to start the job
function startJob(chatId) {
  if (jobs.has(chatId)) {
    clearInterval(jobs.get(chatId));
  }

  const job = setInterval(() => {
    jobFunction(chatId);
  }, 300000); // 120000 ms = 2 minutes
  jobs.set(chatId, job);
}

// Command handler for starting the job
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  startJob(chatId);
  bot.sendMessage(chatId, "Bot started! 😄 Sending updates every 2 minutes.");
});

// Command handler for stopping the job
bot.onText(/\/stop/, (msg) => {
  const chatId = msg.chat.id;
  stopJob(chatId);
  bot.sendMessage(chatId, "Bot stopped! No further updates will be sent.");
});

bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  if (!msg.text.startsWith("/")) {
    bot.sendMessage(chatId, "Send me a command like /start or /stop.");
  }
});
