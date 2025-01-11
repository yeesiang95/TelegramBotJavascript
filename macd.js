function calculateEMA(data, period) {
  const k = 2 / (period + 1); // Smoothing factor
  let emaArray = [];
  let ema = data[0]; // Start EMA with the first value

  for (let i = 0; i < data.length; i++) {
    ema = i === 0 ? data[i] : (data[i] - ema) * k + ema;
    emaArray.push(ema);
  }

  return emaArray;
}

function calculateMACD(closingPrices) {
  const ema12 = calculateEMA(closingPrices, 12);
  const ema26 = calculateEMA(closingPrices, 26);

  // Calculate MACD Line
  const macdLine = ema12.map((value, index) => value - ema26[index]);

  // Calculate Signal Line
  const signalLine = calculateEMA(macdLine, 9);

  // Calculate MACD Histogram
  const histogram = macdLine.map((value, index) => value - signalLine[index]);

  // Return full MACD data
  return macdLine.map((value, index) => ({
    macdLine: value,
    signalLine: signalLine[index],
    histogram: histogram[index],
  }));
}

function checkMacdDivergence(macd, trend, histData, bollingerData) {
  const latestMACD = macd.slice(-100);
  const latestHist = histData.slice(-100);
  const latestBollinger =
    trend === "H"
      ? bollingerData.bollingerHigh.slice(-100)
      : bollingerData.bollingerLow.slice(-100);

  const isDivergence =
    trend === "H"
      ? checkMacdPivotHigh(latestHist, latestMACD, latestBollinger)
      : checkMacdPivotLow(latestHist, latestMACD, latestBollinger);

  return isDivergence;
}

function checkMacdPivotHigh(data, macd, bollenger) {
  const arr = [];
  const latestData = data[data.length - 1];
  const latestMacd = macd[macd.length - 1].macdLine;
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
      const currentMACD = macd[i].macdLine;
      arr.push({
        close: currentHist.close,
        high: currentHist.low,
        macd: currentMACD,
        index: i,
      });
    }
  }
  const res = checkMacdDivergenceHigh(arr, latestData, latestMacd);
  return res;
}

function checkMacdDivergenceHigh(pivotList, latestData, latestMacd) {
  let count = 0;
  for (let i = pivotList.length - 1; i > 0; i--) {
    const currentData = pivotList[i];

    if (
      (currentData.close <= latestData.low ||
        currentData.low <= latestData.low) &&
      currentData.macd >= latestMacd
    ) {
      count = count + 1;
    }
  }
  return count !== 0;
}

function checkMacdPivotLow(data, macd, bollenger) {
  const arr = [];
  const latestData = data[data.length - 1];
  const latestMacd = macd[macd.length - 1].macdLine;

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
      const currentMACD = macd[i].macdLine;
      arr.push({
        close: currentHist.close,
        low: currentHist.low,
        macd: currentMACD,
        index: i,
      });
    }
  }

  const res = checkMacdDivergenceLow(arr, latestData, latestMacd);
  return res;
}

function checkMacdDivergenceLow(pivotList, latestData, latestMacd) {
  let count = 0;
  for (let i = pivotList.length - 1; i > 0; i--) {
    const currentData = pivotList[i];

    if (
      (currentData.close >= latestData.low ||
        currentData.low >= latestData.low) &&
      currentData.macd <= latestMacd
    ) {
      count = count + 1;
    }
  }
  return count !== 0;
}

module.exports = { calculateMACD, checkMacdDivergence };
