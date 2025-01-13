const {
  calculateBollingerBands,
  checkPriceVsBollinger,
} = require("./bollenger");
const { calculateMACD, checkMacdDivergence } = require("./macd");
const { calculateRSI } = require("./rsi");
const { RSI } = require("technicalindicators");
const { calculateUO } = require("./uo");

const rsiPeriod = 14;

async function fetchOHLCV(exchange, symbol, timeframe, since) {
  try {
    const ohlcv = await exchange.fetchOHLCV(symbol, timeframe, since);
    return ohlcv.map((candle) => ({
      timestamp: candle[0],
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4],
      volume: candle[5],
    }));
  } catch (error) {
    console.log("Error fetching OHLCV data:", error);
  }
}

async function getCurrentPrice(exchange, symbol) {
  try {
    const ticker = await exchange.fetchTicker(symbol);
    return ticker["last"];
  } catch (e) {
    console.error("Error fetching price");
  }
}

async function getData(exchange, symbol, timeframe, since) {
  const historicalData = await fetchOHLCV(exchange, symbol, timeframe, since);
  const currentPrice = await getCurrentPrice(exchange, symbol);
  const closingPrices = historicalData.map((item) => item.close);
  const bollengerData = calculateBollingerBands(closingPrices);

  const res = checkPriceAction(
    currentPrice,
    bollengerData,
    symbol,
    historicalData,
    closingPrices
  );

  return res;
}

function checkPriceAction(
  currentPrice,
  bollingerData,
  symbol,
  historicalData,
  closingPrices
) {
  const result = checkPriceVsBollinger(currentPrice, bollingerData, symbol);

  if (!result) {
    return null;
  }

  const rsiData = RSI.calculate({ values: closingPrices, period: rsiPeriod });
  const macdData = calculateMACD(closingPrices);
  const uoData = calculateUO(historicalData);

  const res = checkMacdDivergence(
    macdData,
    result.trend,
    historicalData,
    bollingerData,
    rsiData,
    uoData
  );
  return {
    isOutBollengerBand: true,
    isMacdDivergence: res.isMacdDivergence,
    isRsiDivergence: res.isRsiDivergence,
    isUoDivergence: res.isUoDivergence,
    trend: result.trend,
    bollengerValue: result.bollingerValue,
  };
}

module.exports = { getData, fetchOHLCV };
