const ccxt = require("ccxt");
const symbols = require("./symbols.json");
const TelegramBot = require("node-telegram-bot-api");
const { getData } = require("./dataFetch.js");
require("dotenv").config();

const token = process.env.FIFTEEN_MIN_BOT;
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

function getValue(isMacdDivergence, isRsiDivergence, isUoDivergence) {
  return isMacdDivergence + isRsiDivergence + isUoDivergence;
}

async function processSymbol(exchange, symbol) {
  const timeFrame1 = "1m";
  const timeFrame2 = "15m";
  // const timeFrame3 = "1m";

  const short = await getData(exchange, symbol, timeFrame1);
  const long = await getData(exchange, symbol, timeFrame2);

  if (short && long && short.trend === long.trend) {
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

    const shortValue = getValue(
      short.isMacdDivergence,
      short.isRsiDivergence,
      short.isUoDivergence
    );

    const longValue = getValue(
      long.isMacdDivergence,
      long.isRsiDivergence,
      long.isUoDivergence
    );

    // const superShort = await getData(exchange, symbol, timeFrame3);
    // const superShortText = superShort
    //   ? getText(
    //       timeFrame3,
    //       superShort.isMacdDivergence,
    //       superShort.isRsiDivergence,
    //       superShort.isUoDivergence
    //     )
    //   : "";

    if (shortValue >= 2 && longValue >= 2) {
      return `${symbol.split("/")[0]} - ${
        long.trend
      } ${longText} ${shortText} ${long.bollengerValue}`;
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
