import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Group } from '@visx/group';
import { ViolinPlot, BoxPlot } from '@visx/stats';
import { LinearGradient } from '@visx/gradient';
import { scaleBand, scaleLinear } from '@visx/scale';
import { withTooltip, Tooltip, defaultStyles as defaultTooltipStyles } from '@visx/tooltip';
import { PatternLines } from '@visx/pattern';
import { ParentSize } from '@visx/responsive';

// Colors (customize as needed)
const vizColors = ['#58A182', '#D7C15B', '#7BC889', '#EE8148', '#CEF054', '#476ACA', '#EA5C5C'];

function BoxPlotBase({
  // Add darkMode prop
  darkMode = false,
  width,
  height,
  rawData,
  tooltipOpen,
  tooltipLeft,
  tooltipTop,
  tooltipData,
  showTooltip,
  hideTooltip,
}) {
  const [tooltipConfig, setTooltipConfig] = useState({
    showQuartiles: true,
    showOutliers: true,
    showCount: true,
  });
  const [selectedTheme, setSelectedTheme] = useState(0);
  const [selectedFieldKey, setSelectedFieldKey] = useState(
    rawData.fields?.find((f) => f.type === 'number')?.key || ''
  );
  const [isHorizontal, setIsHorizontal] = useState(false);
  const [showViolin, setShowViolin] = useState(true);
  const [showOutliers, setShowOutliers] = useState(true);

  const numericFields = rawData.fields?.filter((f) => f.type === 'number') || [];

  // Worker and data state setup
  const workerRef = useRef();
  const [calculatedData, setCalculatedData] = useState({
    values: [],
    stats: null,
    binData: []
  });

  // Initialize worker
  useEffect(() => {
    workerRef.current = new Worker(new URL('./boxPlotWorker.js', import.meta.url));
    workerRef.current.onmessage = (e) => {
      setCalculatedData(e.data);
    };

    return () => workerRef.current.terminate();
  }, []);

  // Send data to worker when selection changes
  useEffect(() => {
    if (workerRef.current && selectedFieldKey) {
      workerRef.current.postMessage({ rawData, selectedFieldKey });
    }
  }, [rawData, selectedFieldKey]);

  const { values, stats, binData } = calculatedData;

  if (!stats) return null;

  const minWidth = 300;
  const minHeight = 200;
  const padding = {
    top: 40,
    right: 60,
    bottom: 20,
    left: 60
  };

  const effectiveWidth = Math.max(width, minWidth);
  const effectiveHeight = Math.max(height, minHeight);

  const xMax = effectiveWidth - (padding.left + padding.right);
  const yMax = effectiveHeight - (padding.top + padding.bottom);

  const plotWidth = isHorizontal ? yMax : xMax;
  const plotHeight = isHorizontal ? xMax : yMax;

  const xScale = scaleBand({
    domain: ['selected'],
    range: [0, plotWidth],
    padding: 0.4,
  });

  const yScale = scaleLinear({
    domain: [
      Math.min(stats.min, ...stats.outliers),
      Math.max(stats.max, ...stats.outliers),
    ],
    range: isHorizontal ? [0, plotHeight] : [plotHeight, 0],
  });

  const boxWidth = xScale.bandwidth();
  const constrainedWidth = Math.min(60, boxWidth, effectiveWidth * 0.15);

  // Center the plot by calculating the middle of the container and adjusting for plot width
  const centerOffset = isHorizontal 
    ? (effectiveHeight / 2) - (constrainedWidth / 2)  // Center vertically for horizontal mode
    : (effectiveWidth / 2) - (constrainedWidth / 2);  // Center horizontally for vertical mode

  return (
    <div className="relative dark:bg-[#2C393E] bg-white rounded-lg w-full h-full overflow-hidden">
      <div className="dark:text-white text-gray-900 mb-4 flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4 text-sm">
        <div className="flex flex-wrap gap-2 sm:gap-4">
          <label className="whitespace-nowrap">
            Field:
            <select
              value={selectedFieldKey}
              onChange={(e) => setSelectedFieldKey(e.target.value)}
              className="ml-2 dark:bg-gray-700 bg-gray-100 rounded px-1 py-0.5 text-sm dark:text-white text-gray-900"
              style={{
                backgroundColor: darkMode ? '#4B5563' : '#F3F4F6',
                color: darkMode ? 'white' : 'black'
              }}
            >
              {numericFields.map((field) => (
                <option key={field.key} value={field.key}>
                  {field.label}
                </option>
              ))}
            </select>
          </label>
          <label className="whitespace-nowrap">
            Theme:
            <select
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(Number(e.target.value))}
              className="ml-2 rounded px-1 py-0.5 text-sm"
              style={{
                backgroundColor: darkMode ? '#4B5563' : '#F3F4F6',
                color: darkMode ? 'white' : 'black'
              }}
            >
              {vizColors.map((_, index) => (
                <option key={index} value={index}>
                  Theme {index + 1}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          <label className="whitespace-nowrap">
            <input
              type="checkbox"
              checked={showViolin}
              onChange={() => setShowViolin(!showViolin)}
              className="mr-1"
            />
            Violin
          </label>
          <label className="whitespace-nowrap">
            <input
              type="checkbox"
              checked={showOutliers}
              onChange={() => setShowOutliers(!showOutliers)}
              className="mr-1"
            />
            Outliers
          </label>
          <label className="whitespace-nowrap">
            <input
              type="checkbox"
              checked={isHorizontal}
              onChange={() => setIsHorizontal(!isHorizontal)}
              className="mr-1"
            />
            Horizontal
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          <span className="whitespace-nowrap">Tooltip:</span>
          <label className="whitespace-nowrap">
            <input
              type="checkbox"
              checked={tooltipConfig.showQuartiles}
              onChange={() =>
                setTooltipConfig((prev) => ({
                  ...prev,
                  showQuartiles: !prev.showQuartiles,
                }))
              }
              className="mr-1"
            />
            Quartiles
          </label>
          <label className="whitespace-nowrap">
            <input
              type="checkbox"
              checked={tooltipConfig.showOutliers}
              onChange={() =>
                setTooltipConfig((prev) => ({
                  ...prev,
                  showOutliers: !prev.showOutliers,
                }))
              }
              className="mr-1"
            />
            Outliers
          </label>
          <label className="whitespace-nowrap">
            <input
              type="checkbox"
              checked={tooltipConfig.showCount}
              onChange={() =>
                setTooltipConfig((prev) => ({
                  ...prev,
                  showCount: !prev.showCount,
                }))
              }
              className="mr-1"
            />
            Count
          </label>
        </div>
      </div>

      <svg
        width={effectiveWidth}
        height={effectiveHeight}
        style={{ minHeight }}
      >
        <LinearGradient
          id="statsplot"
          from={vizColors[selectedTheme]}
          to={vizColors[(selectedTheme + 1) % vizColors.length]}
        />
        <rect
          x={0}
          y={0}
          width={effectiveWidth}
          height={effectiveHeight}
          fill="url(#statsplot)"
          rx={14}
        />
        <PatternLines
          id="hViolinLines"
          height={3}
          width={3}
          stroke="#ced4da"
          strokeWidth={1}
          orientation={['horizontal']}
        />

        <Group 
          top={isHorizontal ? centerOffset : padding.top} 
          left={isHorizontal ? padding.left : centerOffset}
        >
          {showViolin && binData.length > 0 && (
            <ViolinPlot
              data={binData}
              valueScale={yScale}
              left={0}
              width={constrainedWidth}
              valueKey="value"
              countKey="count"
              fill="url(#hViolinLines)"
              stroke="#dee2e6"
              horizontal={isHorizontal}
            />
          )}

          <BoxPlot
            min={stats.min}
            max={stats.max}
            left={(isHorizontal ? 0 : 0.3 * constrainedWidth)}
            top={isHorizontal ? 0.3 * constrainedWidth : 0}
            firstQuartile={stats.q1}
            thirdQuartile={stats.q3}
            median={stats.median}
            boxWidth={constrainedWidth * 0.4}
            fill="#FFFFFF"
            fillOpacity={0.3}
            stroke="#FFFFFF"
            strokeWidth={2}
            valueScale={yScale}
            outliers={showOutliers ? stats.outliers : []}
            horizontal={isHorizontal}
            boxProps={{
              onMouseOver: () => {
                const horizontalTooltipPosition = padding.left + (effectiveWidth - (padding.left + padding.right)) / 2;
                showTooltip({
                  tooltipTop: isHorizontal
                    ? centerOffset + (constrainedWidth / 2)
                    : yScale(stats.median) + padding.top,
                  tooltipLeft: isHorizontal
                    ? horizontalTooltipPosition
                    : centerOffset + constrainedWidth + 5,
                  tooltipData: { ...stats, name: selectedFieldKey },
                })
              },
              onMouseLeave: hideTooltip,
            }}
          />
        </Group>
      </svg>

      {tooltipOpen && tooltipData && (
        <Tooltip
          top={tooltipTop}
          left={tooltipLeft}
          style={{ 
            ...defaultTooltipStyles, 
            backgroundColor: document.documentElement.classList.contains('dark') ? '#2C393E' : 'white',
            color: document.documentElement.classList.contains('dark') ? 'white' : 'black',
            border: '1px solid',
            borderColor: document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
          }}
        >
          <div>
            <strong>{tooltipData.name}</strong>
          </div>
          <div className="mt-2 text-sm">
            <div>Max: {tooltipData.max.toFixed(2)}</div>
            {tooltipConfig.showQuartiles && (
              <>
                <div>Q3: {tooltipData.q3.toFixed(2)}</div>
                <div>Median: {tooltipData.median.toFixed(2)}</div>
                <div>Q1: {tooltipData.q1.toFixed(2)}</div>
              </>
            )}
            <div>Min: {tooltipData.min.toFixed(2)}</div>
            {tooltipConfig.showOutliers && tooltipData.outliers?.length > 0 && (
              <div>Outliers: {tooltipData.outliers.length}</div>
            )}
            {tooltipConfig.showCount && <div>Total Points: {values.length}</div>}
          </div>
        </Tooltip>
      )}
    </div>
  );
}

const BoxPlotWithTooltip = withTooltip(BoxPlotBase);

export default function BoxPlotChart({ darkMode = false, ...props }) {
   // 1. Use an effect to toggle the body class
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  // 2. Render as normal
  return (
    <div className="w-full">
      <ParentSize debounceTime={10}>
        {({ width }) => (
          <BoxPlotWithTooltip 
            width={Math.max(width, 300)} 
            height={600} 
            darkMode={darkMode}
            {...props}
          />
        )}
      </ParentSize>
    </div>
  );
}