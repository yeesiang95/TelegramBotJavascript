const ccxt = require("ccxt");
// const symbols = require("./symbols2.json");
const TelegramBot = require("node-telegram-bot-api");
const { getData } = require("./dataFetch.js");
require("dotenv").config();

const token = "7759126314:AAE-H0wkcmMgBLuSbQzyoPsQulXqKqX1j-w";
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
  const timeFrame1 = "1m";
  const timeFrame2 = "5m";
  const timeFrame3 = "15m";
  // const timeFrame3 = "1m";

  const short = await getData(exchange, symbol, timeFrame1, "short");
  const mid = await getData(exchange, symbol, timeFrame2, "long");
  const long = await getData(exchange, symbol, timeFrame3, "long");

  if (
    short &&
    long &&
    mid &&
    short.trend === long.trend &&
    short.trend === mid.trend
  ) {
    const shortText = getText(
      timeFrame1,
      short.isMacdDivergence,
      short.isRsiDivergence,
      short.isUoDivergence,
      short.isKdjDivergence
    );

    const midText = getText(
      timeFrame2,
      mid.isMacdDivergence,
      mid.isRsiDivergence,
      mid.isUoDivergence,
      mid.isKdjDivergence
    );

    const longText = getText(
      timeFrame3,
      long.isMacdDivergence,
      long.isRsiDivergence,
      long.isUoDivergence,
      long.isKdjDivergence
    );

    const shortValue = getValue(
      short.isMacdDivergence,
      short.isRsiDivergence,
      short.isUoDivergence,
      short.isKdjDivergence
    );

    const midValue = getValue(
      mid.isMacdDivergence,
      mid.isRsiDivergence,
      mid.isUoDivergence,
      mid.isKdjDivergence
    );

    const longValue = getValue(
      long.isMacdDivergence,
      long.isRsiDivergence,
      long.isUoDivergence,
      long.isKdjDivergence
    );

    if (shortValue >= 3 && longValue >= 3 && midValue >= 3) {
      return `${symbol.split("/")[0]} - ${long.trend}`;
    } else {
      return "";
    }
  }

  return "";
}

async function jobFunction(chatId) {
  const exchange = new ccxt.bybit({
    options: {
      defaultType: "future", // Set the default type to 'future'
    },
  });

  const symbols = ["BTC/USDT", "ETH/USDT"];

  const ohlcvData = symbols.map((symbol) => processSymbol(exchange, symbol));

  const results = await Promise.all(ohlcvData);
  const filteredResult = results
    .filter((item) => item !== "")
    .sort((a, b) => b.length - a.length);
  console.log(filteredResult);
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
  }, 10000); // 120000 ms = 2 minutes
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
