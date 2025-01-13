function calculateRSI(closingPrices, period = 14) {
  if (closingPrices.length < period) {
    console.error("Not enough data to calculate RSI.");
    return [];
  }

  const rsi = [];
  let gains = 0,
    losses = 0;

  // Initial average gain/loss
  for (let i = 1; i <= period; i++) {
    const diff = closingPrices[i] - closingPrices[i - 1];
    if (diff > 0) {
      gains += diff;
    } else {
      losses -= diff;
    }
  }

  gains /= period;
  losses /= period;

  rsi.push(100 - 100 / (1 + gains / losses));

  // Calculate subsequent RSI values
  for (let i = period + 1; i < closingPrices.length; i++) {
    const diff = closingPrices[i] - closingPrices[i - 1];
    gains = (gains * (period - 1) + (diff > 0 ? diff : 0)) / period;
    losses = (losses * (period - 1) + (diff < 0 ? -diff : 0)) / period;

    const rs = gains / losses;
    rsi.push(100 - 100 / (1 + rs));
  }

  return rsi;
}

function checkRsiPivotHigh(data, rsi, bollenger) {
  const arr = [];
  const latestData = data[data.length - 1];
  const latestRsi = rsi[rsi.length - 1];
  for (let i = data.length - 3; i >= 3; i--) {
    const currentHist = data[i];
    if (currentHist.close > latestData.high) {
      break;
    } else if (
      data[i - 1].high <= currentHist.high &&
      data[i - 2].high <= currentHist.high &&
      data[i + 1].high <= currentHist.high &&
      data[i + 2].high <= currentHist.high &&
      currentHist.high >= bollenger[i]
    ) {
      const currentRsi = rsi[i];
      arr.push({
        close: currentHist.close,
        high: currentHist.low,
        rsi: currentRsi,
        index: i,
      });
    }
  }
  const res = checkRsiDivergenceHigh(arr, latestData, latestRsi);
  return res;
}

function checkRsiDivergenceHigh(pivotList, latestData, latestRsi) {
  let count = 0;
  for (let i = pivotList.length - 1; i > 0; i--) {
    const currentData = pivotList[i];

    if (
      (currentData.close <= latestData.low ||
        currentData.low <= latestData.low) &&
      currentData.rsi >= latestRsi
    ) {
      count = count + 1;
    }
  }
  return count !== 0;
}

function checkRsiPivotLow(data, rsi, bollenger) {
  const arr = [];
  const latestData = data[data.length - 1];
  const latestRsi = rsi[rsi.length - 1];

  for (let i = data.length - 3; i >= 3; i--) {
    const currentHist = data[i];

    if (currentHist.close < latestData.low) {
      break;
    } else if (
      data[i - 1].low >= currentHist.low &&
      data[i - 2].low >= currentHist.low &&
      data[i + 1].low >= currentHist.low &&
      data[i + 2].low >= currentHist.low &&
      currentHist.low <= bollenger[i]
    ) {
      const currentRsi = rsi[i];
      arr.push({
        close: currentHist.close,
        low: currentHist.low,
        rsi: currentRsi,
        index: i,
      });
    }
  }

  const res = checkRsiDivergenceLow(arr, latestData, latestRsi);
  return res;
}

function checkRsiDivergenceLow(pivotList, latestData, latestRsi) {
  let count = 0;
  for (let i = pivotList.length - 1; i > 0; i--) {
    const currentData = pivotList[i];

    if (
      (currentData.close >= latestData.low ||
        currentData.low >= latestData.low) &&
      currentData.rsi <= latestRsi
    ) {
      count = count + 1;
    }
  }
  return count !== 0;
}

module.exports = { calculateRSI, checkRsiPivotHigh, checkRsiPivotLow };
