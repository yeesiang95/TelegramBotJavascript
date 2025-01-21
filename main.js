const ccxt = require("ccxt");
const symbols = require("./symbols.json");
const TelegramBot = require("node-telegram-bot-api");
const { getData } = require("./dataFetch.js");
require("dotenv").config();

const token = process.env.FIRST_BOT;
const bot = new TelegramBot(token, { polling: true });

// Store jobs in a Map to manage multiple chats
const jobs = new Map();

function getText(timeframe, isMacdDivergence, isRsiDivergence, isUoDivergence) {
  if (!isMacdDivergence && !isRsiDivergence && !isUoDivergence) {
    return "";
  }

  const arr = [];
  if (isMacdDivergence) {
    arr.push("🚀");
  }
  if (isRsiDivergence) {
    arr.push("R");
  }

  if (isUoDivergence) {
    arr.push("U");
  }

  return `[${timeframe}: ${arr.toString()}]`;
}

function getPremiumText(value, text) {
  const num = value * 100;

  return num >= 0.2 && num < 0.1 ? "" : `✅ - ${text}`;
}

async function getPremiumIndex(symbol, interval = "1m", trend) {
  const sym = symbol.replace("/", "");
  const url = `https://fapi.binance.com/fapi/v1/premiumIndexKlines?symbol=${sym}&interval=${interval}`;

  const response = await fetch(url);
  const data = await response.json();
  const latestData = data[data.length - 1];
  const secondLatestData = data[data.length - 2];

  const latestLow = latestData[3];
  const secondLow = secondLatestData[3];
  const latestHigh = latestData[2];
  const secondHigh = secondLatestData[2];
  const low = latestLow > secondLow ? secondLow : latestLow;
  const lowT = latestLow > secondLow ? "prev" : "now";
  const high = latestHigh > secondHigh ? latestHigh : secondHigh;
  const highT = latestHigh > secondHigh ? "now" : "prev";
  const trendPremium = trend === "L" ? low : high;
  return getPremiumText(trendPremium, trend === "L" ? lowT : highT);
}

async function processSymbol(exchange, symbol) {
  const timeFrame1 = "1m";
  const timeFrame2 = "5m";
  const since = exchange.parse8601(new Date().getTime());

  const short = await getData(exchange, symbol, timeFrame1, since);
  const long = await getData(exchange, symbol, timeFrame2, since);
  if (short && long && short.trend === long.trend) {
    const premiumText = await getPremiumIndex(symbol, "1m", long.trend);
    if (premiumText.length !== 0) {
      const shortText = getText(
        timeFrame1,
        short.isMacdDivergence,
        short.isRsiDivergence,
        short.isUoDivergence
      );
      const longText = getText(
        timeFrame2,
        long.isMacdDivergence,
        long.isRsiDivergence,
        long.isUoDivergence
      );
      const shortSym = symbol.split("/")[0];
      return `${premiumText}${shortSym} - ${long.trend} ${shortText} ${longText} ${long.bollengerValue}`;
    } else {
      return "";
    }
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
  }, 90000); // 120000 ms = 2 minutes
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
