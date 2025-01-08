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

module.exports = { calculateMACD };
