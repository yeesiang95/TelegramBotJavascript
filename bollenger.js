const technicalindicators = require("technicalindicators");

function calculateBollingerBands(closingPrices) {
  const input = {
    period: 20,
    values: closingPrices,
    stdDev: 2,
  };

  const bollingerBands = technicalindicators.BollingerBands.calculate(input);
  const bollingerHigh = bollingerBands.map((band) => band.upper);
  const bollingerLow = bollingerBands.map((band) => band.lower);

  if (closingPrices.length === 0) {
    return {
      bollingerHigh: null,
      bollingerLow: null,
    };
  }

  return {
    bollingerHigh,
    bollingerLow,
  };
}

function getPricePct(currentPrice, bbData, trend, symbol) {
  const priceDiff = currentPrice - bbData;
  const pctDiff = (priceDiff / bbData) * 100;
  const roundedValue = pctDiff.toFixed(2);
  const text = `${symbol} - ${trend} (${roundedValue})`;
  return { bollingerValue: roundedValue, trend };
}

function checkPriceVsBollinger(currentPrice, bollingerData, symbol) {
  const bbHigh = bollingerData?.bollingerHigh
    ? bollingerData.bollingerHigh[bollingerData.bollingerHigh.length - 1]
    : null;
  const bbLow = bollingerData?.bollingerLow
    ? bollingerData.bollingerLow[bollingerData.bollingerLow.length - 1]
    : null;

  if (bbHigh && currentPrice > bbHigh) {
    return getPricePct(currentPrice, bbHigh, "H", symbol);
  } else if (bbLow && currentPrice < bbLow) {
    return getPricePct(currentPrice, bbLow, "L", symbol);
  }
  return null;
}

module.exports = { calculateBollingerBands, checkPriceVsBollinger };
