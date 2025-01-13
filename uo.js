function calculateUO(histData, trend) {
  const highPrices = histData.map((item) => item.high);
  const lowPrices = histData.map((item) => item.low);
  const closePrices = histData.map((item) => item.close);

  const shortPeriod = 7;
  const mediumPeriod = 14;
  const longPeriod = 28;

  let bp = [];
  let tr = [];

  for (let i = 1; i < histData.length; i++) {
    const high = highPrices[i];
    const low = lowPrices[i];
    const closePrev = closePrices[i - 1];

    const trueRange = Math.max(high, closePrev) - Math.min(low, closePrev);
    const buyingPressure = closePrices[i] - Math.min(low, closePrev);

    tr.push(trueRange);
    bp.push(buyingPressure);
  }

  // Calculate averages for each period
  const calculateAverage = (array, period, index) => {
    const slice = array.slice(index - period + 1, index + 1);
    return slice.reduce((sum, value) => sum + value, 0) / period;
  };

  const uo = [];
  const weights = { short: 4, medium: 2, long: 1 }; // Weights for each period

  for (
    let i = Math.max(shortPeriod, mediumPeriod, longPeriod) - 1;
    i < tr.length;
    i++
  ) {
    const shortAvgBP = calculateAverage(bp, shortPeriod, i);
    const shortAvgTR = calculateAverage(tr, shortPeriod, i);
    const mediumAvgBP = calculateAverage(bp, mediumPeriod, i);
    const mediumAvgTR = calculateAverage(tr, mediumPeriod, i);
    const longAvgBP = calculateAverage(bp, longPeriod, i);
    const longAvgTR = calculateAverage(tr, longPeriod, i);

    const avgShort = shortAvgBP / shortAvgTR;
    const avgMedium = mediumAvgBP / mediumAvgTR;
    const avgLong = longAvgBP / longAvgTR;

    const ultimateOscillator =
      (100 *
        (weights.short * avgShort +
          weights.medium * avgMedium +
          weights.long * avgLong)) /
      (weights.short + weights.medium + weights.long);

    uo.push(ultimateOscillator);
  }
  return uo;
}

function checkUoPivotHigh(data, uo, bollenger) {
  const arr = [];
  const latestData = data[data.length - 1];
  const latestUo = uo[uo.length - 1];
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
      const currentUo = uo[i];
      arr.push({
        close: currentHist.close,
        high: currentHist.low,
        uo: currentUo,
        index: i,
      });
    }
  }
  const res = checkUoDivergenceHigh(arr, latestData, latestUo);
  return res;
}

function checkUoDivergenceHigh(pivotList, latestData, latestUo) {
  let count = 0;
  for (let i = pivotList.length - 1; i > 0; i--) {
    const currentData = pivotList[i];

    if (
      (currentData.close <= latestData.low ||
        currentData.low <= latestData.low) &&
      currentData.uo >= latestUo
    ) {
      count = count + 1;
    }
  }
  return count !== 0;
}

function checkUoPivotLow(data, uo, bollenger) {
  const arr = [];
  const latestData = data[data.length - 1];
  const latestUo = uo[uo.length - 1];

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
      const currentUo = uo[i];
      arr.push({
        close: currentHist.close,
        low: currentHist.low,
        uo: currentUo,
        index: i,
      });
    }
  }

  const res = checkUoDivergenceLow(arr, latestData, latestUo);
  return res;
}

function checkUoDivergenceLow(pivotList, latestData, latestUo) {
  let count = 0;
  for (let i = pivotList.length - 1; i > 0; i--) {
    const currentData = pivotList[i];

    if (
      (currentData.close >= latestData.low ||
        currentData.low >= latestData.low) &&
      currentData.uo <= latestUo
    ) {
      count = count + 1;
    }
  }
  return count !== 0;
}

module.exports = { calculateUO, checkUoPivotHigh, checkUoPivotLow };
