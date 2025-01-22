/* eslint-disable no-restricted-globals */
// Box Plot Data Processing Worker

self.onmessage = (e) => {
    const { rawData, selectedFieldKey } = e.data;
  
    if (!selectedFieldKey) {
      return self.postMessage({ values: [], stats: null, binData: [] });
    }
  
    // Extract numeric values
    const vals = rawData.data
      .map((d) => d[selectedFieldKey])
      .filter((v) => typeof v === 'number');
  
    if (!vals.length) {
      return self.postMessage({ values: [], stats: null, binData: [] });
    }
  
    const sorted = [...vals].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const median = sorted[Math.floor(sorted.length * 0.5)];
    const iqr = q3 - q1;
  
    const lowerBoundary = q1 - 1.5 * iqr;
    const upperBoundary = q3 + 1.5 * iqr;
    const outliers = sorted.filter((v) => v < lowerBoundary || v > upperBoundary);
    const nonOutliers = sorted.filter((v) => v >= lowerBoundary && v <= upperBoundary);
  
    const minVal = Math.min(...vals);
    const maxVal = Math.max(...vals);
    const binCount = Math.min(50, Math.floor(Math.sqrt(vals.length)));
    const binWidth = (maxVal - minVal) / binCount;
    const bins = Array(binCount).fill(0);
    
    vals.forEach((v) => {
      const binIndex = Math.min(binCount - 1, Math.floor((v - minVal) / binWidth));
      bins[binIndex]++;
    });
    
    const maxBin = Math.max(...bins);
    const binned = bins.map((count, i) => ({
      value: minVal + (i + 0.5) * binWidth,
      count: count / maxBin,
    }));
  
    self.postMessage({
      values: vals,
      stats: {
        min: nonOutliers[0],
        max: nonOutliers[nonOutliers.length - 1],
        median,
        q1,
        q3,
        outliers,
      },
      binData: binned,
    });
  };