const ccxt = require("ccxt");
const symbols = require("./symbols.json");
const technicalindicators = require("technicalindicators");
const TelegramBot = require("node-telegram-bot-api");
const { getData } = require("./utils/dataFetch.js");
require("dotenv").config();

const token = process.env.FIRST_BOT;
const bot = new TelegramBot(token, { polling: true });

// Store jobs in a Map to manage multiple chats
const jobs = new Map();

async function processSymbol(exchange, symbol) {
  const timeFrame1 = "1m";
  const timeFrame2 = "5m";
  const since = exchange.parse8601(new Date().getTime());

  const short = await getData(exchange, symbol, timeFrame1, since);
  const long = await getData(exchange, symbol, timeFrame2, since);

  //   if (short.trend && long.trend) {
  //     const shortText = short.count !== 0 ? `${timeFrame1}: 🚀 ` : "";
  //     const longText = long.count !== 0 ? ` ${timeFrame2}: 🚀 ` : "";
  //     return `${long.text} ${shortText}${longText}`;
  //   }
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
  const filteredResult = results.filter((item) => item !== "");
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
  }, 15000); // 120000 ms = 2 minutes
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
