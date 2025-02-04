const {
  calculateBollingerBands,
  checkPriceVsBollinger,
} = require("./bollenger");
const { calculateMACD, checkMacdDivergence } = require("./macd");
const { calculateRSI } = require("./rsi");
const { RSI } = require("technicalindicators");
const { calculateUO } = require("./uo");
const { calculateKDJ } = require("./kdj");

const rsiPeriod = 14;

async function fetchOHLCV(exchange, symbol, timeframe) {
  try {
    const limit = 250;
    const ohlcv = await exchange.fetchOHLCV(
      symbol,
      timeframe,
      undefined,
      limit
    );
    return ohlcv.map((candle) => ({
      timestamp: candle[0],
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4],
      volume: candle[5],
    }));
  } catch (error) {
    return [];
    console.log("Error fetching OHLCV data:", error);
  }
}

async function getCurrentPrice(exchange, symbol) {
  try {
    const ticker = await exchange.fetchTicker(symbol);
    return ticker["last"];
  } catch (e) {
    return null;
    console.error("Error fetching price");
  }
}

async function getData(exchange, symbol, timeframe, since, timeframeType) {
  const historicalData = await fetchOHLCV(exchange, symbol, timeframe, since);
  const currentPrice = await getCurrentPrice(exchange, symbol);
  if (!historicalData && !currentPrice) {
    return null;
  }
  const closingPrices = historicalData.map((item) => item.close);
  const bollengerData = calculateBollingerBands(closingPrices);

  const res = checkPriceAction(
    currentPrice,
    bollengerData,
    symbol,
    historicalData,
    closingPrices,
    timeframeType
  );

  return res;
}

function checkPriceAction(
  currentPrice,
  bollingerData,
  symbol,
  historicalData,
  closingPrices,
  timeframeType
) {
  const result = checkPriceVsBollinger(currentPrice, bollingerData, symbol);

  if (!result) {
    return null;
  }

  const rsiData = RSI.calculate({ values: closingPrices, period: rsiPeriod });
  const macdData = calculateMACD(closingPrices);
  const uoData = calculateUO(historicalData);
  const kdjData = calculateKDJ(historicalData);
  const jData = kdjData.jValues;

  const res = checkMacdDivergence(
    macdData,
    result.trend,
    historicalData,
    bollingerData,
    rsiData,
    uoData,
    jData,
    timeframeType
  );
  return {
    isOutBollengerBand: true,
    isKdjDivergence: res.isKdjDivergence,
    isMacdDivergence: res.isMacdDivergence,
    isRsiDivergence: res.isRsiDivergence,
    isUoDivergence: res.isUoDivergence,
    trend: result.trend,
    bollengerValue: result.bollingerValue,
  };
}

module.exports = { getData, fetchOHLCV };
