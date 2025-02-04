function calculateKDJ(data, period = 9, smoothK = 3, smoothD = 3) {
  let rsv = []; // RSV values
  let kValues = [];
  let dValues = [];
  let jValues = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      rsv.push(null); // Not enough data to calculate
      kValues.push(null);
      dValues.push(null);
      jValues.push(null);
      continue;
    }

    let recentData = data.slice(i - period + 1, i + 1);
    let highMax = Math.max(...recentData.map((d) => d.high));
    let lowMin = Math.min(...recentData.map((d) => d.low));
    let close = data[i].close;

    let rsvValue = ((close - lowMin) / (highMax - lowMin)) * 100;
    rsv.push(rsvValue);

    let k =
      i === period - 1 ? 50 : (2 / 3) * kValues[i - 1] + (1 / 3) * rsvValue;
    let d = i === period - 1 ? 50 : (2 / 3) * dValues[i - 1] + (1 / 3) * k;
    let j = 3 * k - 2 * d;

    kValues.push(k);
    dValues.push(d);
    jValues.push(j);
  }

  return { kValues, dValues, jValues };
}

function checkKdjPivotHigh(data, kdj, bollenger) {
  const arr = [];
  const latestData = data[data.length - 1];
  const latestKdj = kdj[kdj.length - 1];
  for (let i = data.length - 4; i >= 4; i--) {
    const currentHist = data[i];
    if (currentHist.close > latestData.high) {
      break;
    } else if (
      data[i - 1].high <= currentHist.high &&
      data[i - 2].high <= currentHist.high &&
      data[i - 3].high <= currentHist.high &&
      data[i + 1].high <= currentHist.high &&
      data[i + 2].high <= currentHist.high &&
      data[i + 3].high <= currentHist.high
    ) {
      const currentKdj = kdj[i];
      arr.push({
        close: currentHist.close,
        high: currentHist.low,
        kdj: currentKdj,
        index: i,
      });
    }
  }
  const res = checkKdjDivergenceHigh(arr, latestData, latestKdj);
  return res;
}

function checkKdjDivergenceHigh(pivotList, latestData, latestKdj) {
  let count = 0;
  for (let i = pivotList.length - 1; i > 0; i--) {
    const currentData = pivotList[i];

    if (
      (currentData.close <= latestData.low ||
        currentData.low <= latestData.low) &&
      currentData.kdj >= latestKdj
    ) {
      count = count + 1;
    }
  }
  return count !== 0;
}

function checkKdjPivotLow(data, kdj, bollenger) {
  const arr = [];
  const latestData = data[data.length - 1];
  const latestKdj = kdj[kdj.length - 1];

  for (let i = data.length - 4; i >= 4; i--) {
    const currentHist = data[i];

    if (currentHist.close < latestData.low) {
      break;
    } else if (
      data[i - 1].low >= currentHist.low &&
      data[i - 2].low >= currentHist.low &&
      data[i - 3].low >= currentHist.low &&
      data[i + 1].low >= currentHist.low &&
      data[i + 2].low >= currentHist.low &&
      data[i + 3].low >= currentHist.low
    ) {
      const currentKdj = kdj[i];
      arr.push({
        close: currentHist.close,
        low: currentHist.low,
        kdj: currentKdj,
        index: i,
      });
    }
  }

  const res = checkKdjDivergenceLow(arr, latestData, latestKdj);
  return res;
}

function checkKdjDivergenceLow(pivotList, latestData, latestKdj) {
  let count = 0;
  for (let i = pivotList.length - 1; i > 0; i--) {
    const currentData = pivotList[i];

    if (
      (currentData.close >= latestData.low ||
        currentData.low >= latestData.low) &&
      currentData.kdj <= latestKdj
    ) {
      count = count + 1;
    }
  }
  return count !== 0;
}

module.exports = { calculateKDJ, checkKdjPivotHigh, checkKdjPivotLow };
