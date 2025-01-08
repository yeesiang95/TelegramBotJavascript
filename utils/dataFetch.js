const { calculateBollingerBands } = require("./bollenger");
const { calculateMACD } = require("./macd");

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

  const macdData = calculateMACD(closingPrices);
  const res = checkPriceAction(currentPrice, bollengerData, symbol, macdData);
  console.log(macdData[macdData.length - 1].macdLine);
}

function checkPriceAction(currentPrice, bollingerData, symbol, macdData) {
  const result = checkPriceVsBollinger(currentPrice, bollingerData, symbol);

  if (!result) {
    return null;
  }

  const res = checkMACDDivergence(
    macdData,
    result.trend,
    historicalData,
    bollingerData
  );
}

module.exports = { getData, fetchOHLCV };
