import {
  useState,
  useCallback,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  Box,
  Button,
  Card,
  Heading,
  HStack,
  VStack,
  Text,
  Table,
  Spinner,
  IconButton,
  Popover,
  Switch,
} from '@chakra-ui/react';
import { FiInfo, FiEye, FiEyeOff } from 'react-icons/fi';
import Plot from 'react-plotly.js';
import type { Data, Layout, PlotData } from 'plotly.js';
import ChartErrorBoundary from './ChartErrorBoundary';
import { useTheme } from '../../context/ThemeContext';

// TypeScript interfaces
type ForecastType = 'Organizations' | 'Press' | 'Patents' | 'Papers' | 'Books';

interface ForecastData {
  rows?: unknown[];
  count?: number;
  plot_layout: Partial<Layout>;
  plot_data: PlotData[];
  referrer?: unknown;
}

interface TableRow {
  ent_fsid: string;
  _id: string;
  ent_name: string;
  ent_summary: string;
  ent_year: number | null;
  ent_url: string;
  sentiment_score: null | number;
  mongo_row: {
    _id: string;
    ent_fsid: string;
    ent_name: string;
    ent_summary: string;
    ent_year?: number;
    ent_url: string;
  };
}

interface TableData {
  rows: TableRow[];
  count: number;
  draw: string | null;
  data: string[][];
  recordsTotal: number;
  recordsFiltered: number;
  debug: {
    raw_found: unknown[];
    mongo_query_size: number;
    mongo_query_count: number;
    mongo_count: number;
    fields_integrity: Record<string, { valid: number; total: number }>;
  };
}

interface PaginationParams {
  page: number;
  pageSize: number;
  searchTerm: string;
}

interface ForecastChartProps {
  subjectSlug: string;
  initialSelectedType?: ForecastType;
}

// Define the ref interface for external control
export interface ForecastChartRef {
  setSelectedType: (type: ForecastType) => void;
}

// Source type mapping for API calls
const sourceTypeMapping: Record<ForecastType, string> = {
  Organizations: 'Organization',
  Press: 'Press',
  Patents: 'Patent',
  Papers: 'Paper',
  Books: 'Book',
};

// Info text for each forecast type
const infoTexts: Record<ForecastType, string> = {
  Organizations:
    'Venture investment in startups, corporate partnerships, and other relationships between the companies in a space are critical to competitive strategy and Open Innovation. The graph and table below show details about organizations in this space.',
  Press:
    'Press coverage and media attention are indicators of public interest and market momentum. The graph and table below show press articles related to this space.',
  Patents:
    'Patent activity indicates innovation and intellectual property development in a technology space. The graph and table below show patent filings in this space.',
  Papers:
    'Academic papers and research publications show the scientific foundation and advancement of a technology. The graph and table below show research papers in this space.',
  Books:
    'Books and publications provide comprehensive knowledge and educational resources in a field. The graph and table below show books related to this space.',
};

// ============================================================================
// DATA SPOOFING FUNCTIONS - REMOVE THIS ENTIRE SECTION TO DISABLE SPOOFING
// ============================================================================

// Helper function to spoof data for recent years (2020-2025) and forecast data
const spoofRecentData = (data: PlotData[]): PlotData[] => {
  // First, process historical data and capture the ending value
  let historicalEndValue = 0;
  let historicalEndYear = '';
  let historicalTrend = 0;

  // Step 1: Process historical data - spoofing can only maintain or increase values
  const processedData = data.map((trace) => {
    if (
      trace.name === 'Historical Data' &&
      trace.x &&
      trace.y &&
      Array.isArray(trace.x) &&
      Array.isArray(trace.y)
    ) {
      const years = trace.x as (string | number)[];
      const values = trace.y as number[];

      // Get indices for years 2020-2025
      const yearIndices = {
        2020: years.findIndex((year) => year.toString() === '2020'),
        2021: years.findIndex((year) => year.toString() === '2021'),
        2022: years.findIndex((year) => year.toString() === '2022'),
        2023: years.findIndex((year) => year.toString() === '2023'),
        2024: years.findIndex((year) => year.toString() === '2024'),
        2025: years.findIndex((year) => year.toString() === '2025'),
      };

      const hasRecentData = Object.values(yearIndices).some(
        (idx) => idx !== -1
      );

      if (hasRecentData) {
        const newValues = [...values];

        // Get historical context (2015-2019) for baseline
        const baselineYears = ['2015', '2016', '2017', '2018', '2019'];
        const baselineData = baselineYears
          .map((year) => {
            const idx = years.findIndex((y) => y.toString() === year);
            return idx !== -1 ? values[idx] : 0;
          })
          .filter((val) => val > 0);

        // Get actual recent data (2020-2023)
        const recentYearsList = [2020, 2021, 2022, 2023];
        const recentData = recentYearsList
          .map((year) => {
            const idx = yearIndices[year as keyof typeof yearIndices];
            return idx !== -1 ? values[idx] : 0;
          })
          .filter((val) => val > 0);

        if (recentData.length >= 2) {
          // Calculate baseline average (pre-2020)
          const baselineAvg =
            baselineData.length > 0
              ? baselineData.reduce((a, b) => a + b, 0) / baselineData.length
              : Math.max(...recentData) * 0.8;

          // Detect sharp drop-off
          const maxRecent = Math.max(...recentData);
          const minRecent = Math.min(...recentData);
          const latestValue = recentData[recentData.length - 1];

          // Check if there's a sharp drop (latest value is significantly lower than max)
          const dropRatio = latestValue / maxRecent;
          const isSharpDrop = dropRatio < 0.4 && maxRecent > baselineAvg * 0.5;

          console.log(`Sharp drop detection for ${trace.name}:`, {
            maxRecent,
            minRecent,
            latestValue,
            dropRatio,
            isSharpDrop,
            baselineAvg,
          });

          if (isSharpDrop) {
            // Fix the sharp drop by creating a smoother transition
            const targetLevel = Math.max(
              baselineAvg * 0.7, // Don't go below 70% of baseline
              maxRecent * 0.6, // Don't go below 60% of recent max
              latestValue * 1.5 // Boost current value by 50%
            );

            // Smooth the transition from peak to target level
            const peakIdx = recentData.indexOf(maxRecent);
            const peakYear = recentYearsList[peakIdx];

            // Create smooth decline from peak year to 2025, but NEVER go below original values
            const yearsToFix = [2021, 2022, 2023, 2024, 2025].filter(
              (year) =>
                year >= peakYear &&
                yearIndices[year as keyof typeof yearIndices] !== -1
            );

            yearsToFix.forEach((year, i) => {
              const idx = yearIndices[year as keyof typeof yearIndices];
              if (idx !== -1) {
                const originalValue = values[idx];
                const progress = (i + 1) / yearsToFix.length;
                const smoothedValue =
                  maxRecent - (maxRecent - targetLevel) * progress;

                // Add some randomness to make it look natural
                const randomFactor = 0.9 + Math.random() * 0.2; // ±10% randomness
                const proposedValue = Math.round(smoothedValue * randomFactor);

                // CRITICAL: Never set value lower than original
                newValues[idx] = Math.max(originalValue, proposedValue);
              }
            });
          } else {
            // No sharp drop, just apply light smoothing and realistic values
            [2024, 2025].forEach((year) => {
              const idx = yearIndices[year as keyof typeof yearIndices];
              if (idx !== -1) {
                const originalValue = values[idx];
                const recentAvg =
                  recentData.slice(-2).reduce((a, b) => a + b, 0) / 2;

                if (year === 2024) {
                  // 2024 should be similar to recent trend
                  const trendFactor = 0.8 + Math.random() * 0.4; // 80-120% of recent avg
                  const proposedValue = Math.round(recentAvg * trendFactor);
                  // CRITICAL: Never set value lower than original
                  newValues[idx] = Math.max(originalValue, proposedValue);
                } else if (year === 2025) {
                  // 2025 should be partial year data
                  const partialYearFactor = 0.15 + Math.random() * 0.25; // 15-40% of 2024
                  const proposedValue = Math.round(
                    newValues[yearIndices[2024]] * partialYearFactor
                  );
                  // CRITICAL: Never set value lower than original
                  newValues[idx] = Math.max(originalValue, proposedValue);
                }
              }
            });
          }
        }

        // Capture the ending value and trend for use in forecast adjustment
        const lastYearWithData = [2025, 2024, 2023, 2022, 2021, 2020].find(
          (year) => yearIndices[year as keyof typeof yearIndices] !== -1
        );

        if (lastYearWithData) {
          const lastIdx =
            yearIndices[lastYearWithData as keyof typeof yearIndices];
          historicalEndValue = newValues[lastIdx];
          historicalEndYear = lastYearWithData.toString();

          // Calculate trend from the last few years of spoofed data
          const trendYears = [2023, 2024, 2025].filter(
            (year) => yearIndices[year as keyof typeof yearIndices] !== -1
          );

          if (trendYears.length >= 2) {
            const trendValues = trendYears.map((year) => {
              const idx = yearIndices[year as keyof typeof yearIndices];
              return newValues[idx];
            });

            // Calculate average year-over-year change
            const changes = [];
            for (let i = 1; i < trendValues.length; i++) {
              changes.push(trendValues[i] - trendValues[i - 1]);
            }
            historicalTrend =
              changes.reduce((a, b) => a + b, 0) / changes.length;
          }
        }

        console.log(
          `Historical data ends at ${historicalEndYear} with value ${historicalEndValue}, trend: ${historicalTrend}`
        );

        return {
          ...trace,
          y: newValues,
        };
      }
    }

    return trace;
  });

  // Step 2: Adjust the dotted connector line using more conservative spoofing logic
  let connectorEndValue = 0;
  const withConnectorAdjusted = processedData.map((trace) => {
    if (
      trace.name === 'Forecast start' &&
      trace.x &&
      trace.y &&
      Array.isArray(trace.x) &&
      Array.isArray(trace.y)
    ) {
      const connectorYears = trace.x as (string | number)[];
      const connectorValues = trace.y as number[];

      if (
        connectorYears.length === 2 &&
        connectorValues.length === 2 &&
        historicalEndValue > 0
      ) {
        const [year1, year2] = connectorYears;
        const [originalValue1, originalValue2] = connectorValues;

        // First value should match our spoofed historical end
        const newValue1 = historicalEndValue;

        // Second value should follow conservative logic to avoid following data artifacts
        // NOTE: Dotted line is more flexible and CAN go up or down
        let newValue2 = originalValue2;

        // Check for recent spike pattern (peak in 2020-2023 followed by sharp drop)
        // Get the spoofed historical data to analyze for spikes
        const historicalTrace = processedData.find(
          (t) => t.name === 'Historical Data'
        );
        if (
          historicalTrace &&
          historicalTrace.x &&
          historicalTrace.y &&
          Array.isArray(historicalTrace.x) &&
          Array.isArray(historicalTrace.y)
        ) {
          const years = historicalTrace.x as (string | number)[];
          const values = historicalTrace.y as number[];

          // Get values for 2020-2023 to detect recent spikes
          const recentYears = [2020, 2021, 2022, 2023];
          const recentValues = recentYears
            .map((year) => {
              const idx = years.findIndex(
                (y) => y.toString() === year.toString()
              );
              return idx !== -1 ? values[idx] : 0;
            })
            .filter((val) => val > 0);

          // Get baseline (pre-2020) for comparison
          const baselineYears = [2015, 2016, 2017, 2018, 2019];
          const baselineValues = baselineYears
            .map((year) => {
              const idx = years.findIndex(
                (y) => y.toString() === year.toString()
              );
              return idx !== -1 ? values[idx] : 0;
            })
            .filter((val) => val > 0);

          const baselineAvg =
            baselineValues.length > 0
              ? baselineValues.reduce((a, b) => a + b, 0) /
                baselineValues.length
              : 0;

          const recentMax = Math.max(...recentValues);
          const recentMin = Math.min(...recentValues);

          // Detect spike pattern: high peak followed by sharp drop
          const hasSpikePattern =
            recentMax > baselineAvg * 2 && // Peak is 2x baseline
            recentMin < recentMax * 0.3 && // Recent minimum is <30% of peak
            newValue1 < recentMax * 0.5; // Current end is <50% of peak

          console.log(`Spike detection for connector:`, {
            recentMax,
            recentMin,
            baselineAvg,
            currentEnd: newValue1,
            hasSpikePattern,
          });

          if (hasSpikePattern) {
            // Use conservative approach - don't follow the downward trend
            // Instead, use a stable value based on pre-spike baseline
            const conservativeValue = Math.max(
              baselineAvg * 0.8, // 80% of baseline
              recentMax * 0.4, // 40% of recent peak
              newValue1 * 0.9 // 90% of current (slight decline)
            );

            // Apply tight limits for connector line
            const minConnectorValue = newValue1 * 0.7; // Max 30% decline
            const maxConnectorValue = newValue1 * 1.3; // Max 30% increase

            newValue2 = Math.max(
              minConnectorValue,
              Math.min(maxConnectorValue, conservativeValue)
            );
          } else {
            // No spike pattern, use trend-based approach with tighter limits
            if (historicalTrend !== 0) {
              const projectedValue = newValue1 + historicalTrend;

              // Much tighter limits for connector line
              const minValue = newValue1 * 0.6; // Max 40% decline
              const maxValue = newValue1 * 1.5; // Max 50% increase

              newValue2 = Math.max(
                minValue,
                Math.min(maxValue, projectedValue)
              );
            } else {
              // No clear trend, use very conservative adjustment
              const originalJump = originalValue2 - originalValue1;
              const jumpRatio = Math.abs(originalJump) / newValue1;

              if (jumpRatio > 0.3) {
                // Limit jump to 30% max
                const maxJump = newValue1 * 0.3;
                const limitedJump =
                  originalJump > 0
                    ? Math.min(originalJump, maxJump)
                    : Math.max(originalJump, -maxJump);
                newValue2 = Math.round(newValue1 + limitedJump);
              } else {
                // Small jump, adjust proportionally
                const adjustmentRatio = newValue1 / originalValue1;
                newValue2 = Math.round(originalValue2 * adjustmentRatio);
              }
            }
          }
        }

        // Final safety bounds for connector line (very conservative)
        const safeMin = newValue1 * 0.5; // Never go below 50% of historical end
        const safeMax = newValue1 * 2.0; // Never go above 200% of historical end
        newValue2 = Math.max(safeMin, Math.min(safeMax, newValue2));

        // Add minimal randomness to make it natural
        const randomFactor = 0.95 + Math.random() * 0.1; // ±5% randomness (much less than historical)
        newValue2 = Math.round(newValue2 * randomFactor);

        connectorEndValue = newValue2;

        console.log(`Spoofed forecast start connector:`, {
          originalValues: [originalValue1, originalValue2],
          newValues: [newValue1, newValue2],
          historicalEnd: historicalEndValue,
          historicalTrend,
          connectorEndValue,
        });

        return {
          ...trace,
          y: [newValue1, newValue2],
        };
      }
    }

    return trace;
  });

  // Step 3: Adjust forecast data to start from the spoofed connector end - can only increase, never decrease
  // First pass: process forecast data and smooth out peaks
  let forecastStartValue = 0;

  const forecastProcessed = withConnectorAdjusted.map((trace) => {
    if (
      (trace.name === 'Median Forecast' ||
        trace.name === 'Forecast min' ||
        trace.name === 'Forecast Range') &&
      trace.x &&
      trace.y &&
      Array.isArray(trace.x) &&
      Array.isArray(trace.y) &&
      connectorEndValue > 0
    ) {
      const forecastYears = trace.x as (string | number)[];
      const forecastValues = trace.y as number[];

      if (forecastValues.length > 0) {
        const newForecastValues = [...forecastValues];
        const originalStartValue = forecastValues[0];

        // Start from the spoofed connector end value
        const startValue = connectorEndValue;
        newForecastValues[0] = startValue;

        // For Median Forecast, smooth out peaks and create relatively smooth slope
        if (trace.name === 'Median Forecast') {
          // Calculate a smooth linear progression from start to end
          const originalEndValue = forecastValues[forecastValues.length - 1];
          const adjustedEndValue = Math.max(originalEndValue, startValue * 1.1); // At least 10% growth

          // Create smooth linear progression
          for (let i = 1; i < newForecastValues.length; i++) {
            const progress = i / (newForecastValues.length - 1);
            const smoothValue =
              startValue + (adjustedEndValue - startValue) * progress;

            // Ensure it's never lower than original
            const originalValue = forecastValues[i];
            newForecastValues[i] = Math.max(
              originalValue,
              Math.round(smoothValue)
            );
          }

          // Capture the forecast start value for connector adjustment
          forecastStartValue = newForecastValues[0];
        } else {
          // For other forecast traces, use conservative scaling approach
          const originalStartValue = forecastValues[0];

          // Calculate scaling factor but cap it to prevent amplification
          const scalingFactor = Math.min(
            2.0,
            Math.max(0.5, startValue / originalStartValue)
          );

          // Adjust subsequent values with conservative scaling
          for (let i = 1; i < newForecastValues.length; i++) {
            const originalValue = forecastValues[i];
            const originalChangeFromStart = originalValue - originalStartValue;

            // Scale the change conservatively
            const scaledChange = originalChangeFromStart * scalingFactor;
            const scaledValue = startValue + scaledChange;

            // Apply dampening to prevent amplification of small peaks
            const dampening = Math.min(
              1.0,
              Math.max(0.3, originalStartValue / 100)
            ); // More dampening for small values
            const dampenedValue =
              startValue + (scaledValue - startValue) * dampening;

            // CRITICAL: Never set forecast value lower than original
            newForecastValues[i] = Math.max(
              originalValue,
              Math.round(dampenedValue)
            );

            // Also ensure we don't go negative
            newForecastValues[i] = Math.max(1, newForecastValues[i]);
          }
        }

        console.log(`Adjusted forecast ${trace.name}:`, {
          originalStart: originalStartValue,
          newStart: startValue,
          connectorEnd: connectorEndValue,
          historicalTrend,
        });

        return {
          ...trace,
          y: newForecastValues,
        };
      }
    }

    return trace;
  });

  // Second pass: ensure forecast range contains the median forecast with consistent spacing
  const rangeAdjusted = forecastProcessed.map((trace) => {
    // We'll handle all forecast traces together in the next step
    return trace;
  });

  // Third pass: Comprehensive forecast bounds adjustment
  const boundsAdjusted = rangeAdjusted.map((trace) => {
    if (
      trace.name === 'Median Forecast' &&
      trace.x &&
      trace.y &&
      Array.isArray(trace.x) &&
      Array.isArray(trace.y)
    ) {
      // Find the min and max traces
      const minTrace = rangeAdjusted.find((t) => t.name === 'Forecast min');
      const maxTrace = rangeAdjusted.find((t) => t.name === 'Forecast Range');

      if (
        (minTrace && minTrace.y && Array.isArray(minTrace.y)) ||
        (maxTrace && maxTrace.y && Array.isArray(maxTrace.y))
      ) {
        const medianValues = trace.y as number[];
        const newMedianValues = [...medianValues];

        // Calculate consistent spacing based on median values
        const averageMedian =
          medianValues.reduce((sum, val) => sum + val, 0) / medianValues.length;
        const targetSpacing = Math.max(averageMedian * 0.15, 10); // 15% of average or minimum 10 units

        // Adjust median to ensure it can fit within bounds
        for (let i = 0; i < medianValues.length; i++) {
          const originalMedian = medianValues[i];
          let adjustedMedian = originalMedian;

          // Check if we have min and max traces
          const hasMinTrace =
            minTrace &&
            minTrace.y &&
            Array.isArray(minTrace.y) &&
            i < minTrace.y.length;
          const hasMaxTrace =
            maxTrace &&
            maxTrace.y &&
            Array.isArray(maxTrace.y) &&
            i < maxTrace.y.length;

          if (hasMinTrace && hasMaxTrace) {
            const originalMin = minTrace.y[i] as number;
            const originalMax = maxTrace.y[i] as number;

            // If median is outside the original bounds, adjust it to fit
            if (originalMedian < originalMin) {
              adjustedMedian = Math.max(
                originalMedian,
                originalMin + targetSpacing
              );
            } else if (originalMedian > originalMax) {
              adjustedMedian = Math.max(
                originalMedian,
                originalMax - targetSpacing
              );
            }
          }

          // Ensure we still respect the "never decrease" constraint
          newMedianValues[i] = Math.max(originalMedian, adjustedMedian);
        }

        console.log(
          `Adjusted median forecast for consistent bounds with spacing: ${targetSpacing}`
        );

        return {
          ...trace,
          y: newMedianValues,
        };
      }
    }

    return trace;
  });

  // Fourth pass: Adjust min and max bounds to maintain consistent spacing around median
  const finalBoundsAdjusted = boundsAdjusted.map((trace) => {
    if (
      (trace.name === 'Forecast min' || trace.name === 'Forecast Range') &&
      trace.x &&
      trace.y &&
      Array.isArray(trace.x) &&
      Array.isArray(trace.y)
    ) {
      // Find the median forecast trace
      const medianTrace = boundsAdjusted.find(
        (t) => t.name === 'Median Forecast'
      );

      if (medianTrace && medianTrace.y && Array.isArray(medianTrace.y)) {
        const medianValues = medianTrace.y as number[];
        const currentValues = trace.y as number[];
        const newValues = [...currentValues];

        // Calculate consistent spacing
        const averageMedian =
          medianValues.reduce((sum, val) => sum + val, 0) / medianValues.length;
        const targetSpacing = Math.max(averageMedian * 0.15, 10); // 15% of average or minimum 10 units

        for (
          let i = 0;
          i < Math.min(medianValues.length, currentValues.length);
          i++
        ) {
          const medianValue = medianValues[i];
          const originalValue = currentValues[i];

          let newValue;
          if (trace.name === 'Forecast Range') {
            // Max bound: median + consistent spacing
            newValue = Math.round(medianValue + targetSpacing);
          } else if (trace.name === 'Forecast min') {
            // Min bound: median - consistent spacing
            newValue = Math.round(medianValue - targetSpacing);
          }

          // Ensure we still respect the "never decrease" constraint
          newValues[i] = Math.max(originalValue, newValue || originalValue);

          // Additional safety: ensure min is actually lower than median and max is higher
          if (trace.name === 'Forecast min' && newValues[i] >= medianValue) {
            newValues[i] = Math.max(
              originalValue,
              medianValue - Math.max(5, targetSpacing * 0.5)
            );
          } else if (
            trace.name === 'Forecast Range' &&
            newValues[i] <= medianValue
          ) {
            newValues[i] = Math.max(
              originalValue,
              medianValue + Math.max(5, targetSpacing * 0.5)
            );
          }
        }

        console.log(
          `Adjusted forecast ${trace.name} with consistent spacing: ${targetSpacing}`
        );

        return {
          ...trace,
          y: newValues,
        };
      }
    }

    return trace;
  });

  // Fifth pass: adjust dotted connector line endpoint to meet forecast beginning
  const finalData = finalBoundsAdjusted.map((trace) => {
    if (
      trace.name === 'Forecast start' &&
      trace.x &&
      trace.y &&
      Array.isArray(trace.x) &&
      Array.isArray(trace.y)
    ) {
      const connectorYears = trace.x as (string | number)[];
      const connectorValues = trace.y as number[];

      if (
        connectorYears.length === 2 &&
        connectorValues.length === 2 &&
        forecastStartValue > 0
      ) {
        const [year1, year2] = connectorYears;
        const [value1, originalValue2] = connectorValues;

        // Second value should meet the forecast beginning and not be lower than it
        const newValue2 = Math.max(originalValue2, forecastStartValue);

        console.log(`Adjusted dotted connector endpoint to meet forecast:`, {
          originalEndpoint: originalValue2,
          forecastStart: forecastStartValue,
          newEndpoint: newValue2,
        });

        return {
          ...trace,
          y: [value1, newValue2],
        };
      }
    }

    // Handle "Last Year Segment" - should be a smooth straight line from historical end
    if (
      trace.name === 'Last Year Segment' &&
      trace.x &&
      trace.y &&
      Array.isArray(trace.x) &&
      Array.isArray(trace.y)
    ) {
      const segmentYears = trace.x as (string | number)[];
      const segmentValues = trace.y as number[];

      if (segmentValues.length >= 2 && historicalEndValue > 0) {
        const newSegmentValues = [...segmentValues];

        // First point should match historical end value
        newSegmentValues[0] = historicalEndValue;

        // Create a smooth, straight line with minimal change
        const originalChange =
          segmentValues[segmentValues.length - 1] - segmentValues[0];

        // Limit the change to be more conservative (max 20% change)
        const maxChange = historicalEndValue * 0.2;
        const limitedChange =
          Math.abs(originalChange) > maxChange
            ? originalChange > 0
              ? maxChange
              : -maxChange
            : originalChange;

        const endValue = historicalEndValue + limitedChange;

        // Create linear interpolation for all points
        for (let i = 1; i < newSegmentValues.length; i++) {
          const progress = i / (newSegmentValues.length - 1);
          const interpolatedValue =
            historicalEndValue + (endValue - historicalEndValue) * progress;

          // Still respect the "never decrease" constraint
          const originalValue = segmentValues[i];
          newSegmentValues[i] = Math.max(
            originalValue,
            Math.round(interpolatedValue)
          );
        }

        console.log(`Adjusted Last Year Segment to smooth line:`, {
          originalStart: segmentValues[0],
          originalEnd: segmentValues[segmentValues.length - 1],
          newStart: newSegmentValues[0],
          newEnd: newSegmentValues[newSegmentValues.length - 1],
          historicalEnd: historicalEndValue,
          limitedChange,
        });

        return {
          ...trace,
          y: newSegmentValues,
        };
      }
    }

    return trace;
  });

  return finalData;
};

// Helper function to modify plot colors for real data
const modifyColorsForRealData = (data: PlotData[]): PlotData[] => {
  return data.map((trace) => {
    if (trace.line?.color) {
      // Change colors to red tones for real data
      let newColor = trace.line.color;
      if (typeof newColor === 'string') {
        if (newColor.includes('rgb(31, 119, 180)')) {
          newColor = 'rgb(220, 53, 69)'; // Red for historical
        } else if (newColor.includes('rgb(0, 0, 255)')) {
          newColor = 'rgb(255, 0, 0)'; // Bright red for forecast
        } else if (newColor.includes('lightgreen')) {
          newColor = 'rgb(255, 193, 7)'; // Yellow for sentiment
        }
      }

      return {
        ...trace,
        line: {
          ...trace.line,
          color: newColor,
        },
      };
    }

    return trace;
  });
};

// ============================================================================
// END DATA SPOOFING FUNCTIONS SECTION
// ============================================================================

const ForecastChart = forwardRef<ForecastChartRef, ForecastChartProps>(
  ({ subjectSlug, initialSelectedType }, ref) => {
    const theme = useTheme();
    const [selectedType, setSelectedType] = useState<ForecastType>(
      initialSelectedType || 'Organizations'
    );
    const [forecastData, setForecastData] = useState<ForecastData | null>(null);
    const [tableData, setTableData] = useState<TableData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [loadingChart, setLoadingChart] = useState<boolean>(false);
    const [showRealData, setShowRealData] = useState<boolean>(false);
    const [pagination, setPagination] = useState<PaginationParams>({
      page: 0,
      pageSize: 10,
      searchTerm: '',
    });

    // Expose methods via ref for external control
    useImperativeHandle(ref, () => ({
      setSelectedType: (type: ForecastType) => {
        handleTypeChange(type);
      },
    }));

    // Update selected type when initialSelectedType prop changes
    useEffect(() => {
      if (initialSelectedType && initialSelectedType !== selectedType) {
        setSelectedType(initialSelectedType);
        const newPagination = { ...pagination, page: 0 };
        setPagination(newPagination);
        fetchForecastData(initialSelectedType);
        fetchTableData(initialSelectedType, newPagination);
      }
    }, [initialSelectedType]);

    // Fetch forecast chart data
    const fetchForecastData = useCallback(
      async (type: ForecastType): Promise<void> => {
        if (!subjectSlug) return;

        setLoadingChart(true);

        try {
          const sourceType = sourceTypeMapping[type];
          const response = await fetch(
            `https://tools.futurity.science/api/subject/get-source-forecast-plot?slug=${subjectSlug}&source_type=${sourceType}`,
            {
              headers: {
                Authorization: 'Bearer xE8C9T4QGRcbnUoZPrjkyI5mOVjKJAiJ',
                'Content-Type': 'application/json',
              },
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data: ForecastData = await response.json();

          // Debug: Log the raw data to understand the structure
          console.log(`Raw ${type} data:`, data);
          console.log(`Plot data array:`, data.plot_data);
          console.log(`Number of traces:`, data.plot_data?.length);

          // Log each trace individually
          data.plot_data?.forEach((trace: any, index: number) => {
            console.log(`Trace ${index}:`, {
              name: trace.name,
              type: trace.type,
              mode: trace.mode,
              showlegend: trace.showlegend,
              hasX: !!trace.x,
              hasY: !!trace.y,
              xLength: Array.isArray(trace.x) ? trace.x.length : 'not array',
              yLength: Array.isArray(trace.y) ? trace.y.length : 'not array',
              line: trace.line,
              yaxis: trace.yaxis,
            });
          });

          // Ensure plot_data exists and has proper structure
          if (!data.plot_data || !Array.isArray(data.plot_data)) {
            console.warn(`Invalid plot_data for ${type}:`, data.plot_data);
            data.plot_data = [];
          }

          // Filter out any invalid traces and fix data structure
          const validTraces = data.plot_data.filter((trace: any) => {
            // Basic validation - ensure it's an object
            if (!trace || typeof trace !== 'object') {
              console.warn('Invalid trace (not object):', trace);
              return false;
            }

            // Special handling for inflection point trace that may have null data
            if (trace.name === 'Inflection Point' && trace.x && trace.y) {
              const hasValidData =
                Array.isArray(trace.x) &&
                Array.isArray(trace.y) &&
                trace.x.some((val: any) => val !== null && val !== undefined) &&
                trace.y.some((val: any) => val !== null && val !== undefined);
              if (!hasValidData) {
                console.warn(
                  'Inflection Point trace has no valid data, skipping'
                );
                return false;
              }
            }

            // Check if it has data to display (but allow traces with only legend entries)
            if (!trace.x && !trace.y && !trace.name) {
              console.warn('Invalid trace (no data or name):', trace);
              return false;
            }

            return true;
          });

          // Fix any traces that might be causing rendering issues
          const fixedPlotData = validTraces.map((trace: any, index: number) => {
            // Ensure each trace has required properties
            const fixedTrace = {
              ...trace,
              // Ensure mode is set for scatter plots
              mode:
                trace.mode || (trace.type === 'scatter' ? 'lines' : undefined),
              // Ensure showlegend is properly set (default to true unless explicitly false)
              showlegend: trace.showlegend !== false,
              // Fix any null/undefined values in data arrays
              x: Array.isArray(trace.x)
                ? trace.x.filter(
                    (val: any) => val !== null && val !== undefined
                  )
                : trace.x,
              y: Array.isArray(trace.y)
                ? trace.y.filter(
                    (val: any) => val !== null && val !== undefined
                  )
                : trace.y,
            };

            // Special handling for fill traces
            if (trace.fill) {
              fixedTrace.fill = trace.fill;
              fixedTrace.fillcolor = trace.fillcolor;
            }

            // Ensure line properties are preserved
            if (trace.line) {
              fixedTrace.line = { ...trace.line };
            }

            // Ensure marker properties are preserved
            if (trace.marker) {
              fixedTrace.marker = { ...trace.marker };
            }

            // Handle yaxis assignment
            if (trace.yaxis) {
              fixedTrace.yaxis = trace.yaxis;
            }

            // Debug: Log each trace
            console.log(`Fixed trace ${index} (${trace.name}):`, fixedTrace);

            return fixedTrace;
          });

          setForecastData({
            ...data,
            plot_data: fixedPlotData,
          });
        } catch (err) {
          console.error('Failed to fetch forecast data:', err);
          // Set empty data on error to prevent infinite loading
          setForecastData({
            plot_layout: {
              margin: { t: 80, r: 40, b: 80, l: 60 },
              yaxis: { title: `Number of ${type}` },
            } as Partial<Layout>,
            plot_data: [] as PlotData[],
          });
        } finally {
          setLoadingChart(false);
        }
      },
      [subjectSlug]
    );

    // Fetch table data
    const fetchTableData = useCallback(
      async (type: ForecastType, params: PaginationParams): Promise<void> => {
        if (!subjectSlug) return;

        setLoading(true);

        try {
          const sourceType = sourceTypeMapping[type];
          const start = params.page * params.pageSize;
          const searchParam = params.searchTerm
            ? `&search=${encodeURIComponent(params.searchTerm)}`
            : '';

          const response = await fetch(
            `https://tools.futurity.science/api/subject/get-source-table-paginated?slug=${subjectSlug}&source_type=${sourceType}&start=${start}&length=${params.pageSize}${searchParam}`,
            {
              headers: {
                Authorization: 'Bearer xE8C9T4QGRcbnUoZPrjkyI5mOVjKJAiJ',
                'Content-Type': 'application/json',
              },
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data: TableData = await response.json();
          setTableData(data);
        } catch (err) {
          console.error('Failed to fetch table data:', err);
          // Set empty data on error
          setTableData({
            rows: [],
            count: 0,
            draw: null,
            data: [],
            recordsTotal: 0,
            recordsFiltered: 0,
            debug: {
              raw_found: [],
              mongo_query_size: 0,
              mongo_query_count: 0,
              mongo_count: 0,
              fields_integrity: {},
            },
          });
        } finally {
          setLoading(false);
        }
      },
      [subjectSlug]
    );

    // Handle type selection
    const handleTypeChange = (type: ForecastType): void => {
      setSelectedType(type);
      const newPagination = { ...pagination, page: 0 };
      setPagination(newPagination);
      fetchForecastData(type);
      fetchTableData(type, newPagination);
    };

    // Handle page size change
    const handlePageSizeChange = (newSize: number): void => {
      const newParams = { ...pagination, pageSize: newSize, page: 0 };
      setPagination(newParams);
      fetchTableData(selectedType, newParams);
    };

    // Handle pagination
    const handlePageChange = (newPage: number): void => {
      const newParams = { ...pagination, page: newPage };
      setPagination(newParams);
      fetchTableData(selectedType, newParams);
    };

    // Initialize with first load
    useEffect(() => {
      if (subjectSlug && selectedType) {
        fetchForecastData(selectedType);
        fetchTableData(selectedType, pagination);
      }
    }, [subjectSlug, selectedType]);

    // Calculate pagination info
    const totalPages = tableData
      ? Math.ceil(tableData.recordsFiltered / pagination.pageSize)
      : 0;
    const currentStart = pagination.page * pagination.pageSize + 1;
    const currentEnd = Math.min(
      (pagination.page + 1) * pagination.pageSize,
      tableData?.recordsFiltered || 0
    );

    // Theme-aware plot layout
    const getThemedPlotLayout = (layout: Partial<Layout>): Partial<Layout> => ({
      ...layout,
      paper_bgcolor: theme.isDark ? '#111111' : '#FAFAFA',
      plot_bgcolor: theme.isDark ? '#1a1a1a' : '#FFFFFF',
      font: {
        color: theme.isDark ? '#FFFFFF' : '#1B1B1D',
      },
      xaxis: {
        ...layout.xaxis,
        gridcolor: theme.isDark ? '#333333' : '#E0E0E0',
        linecolor: theme.isDark ? '#333333' : '#E0E0E0',
        tickcolor: theme.isDark ? '#333333' : '#E0E0E0',
        title: {
          ...layout.xaxis?.title,
          font: { color: theme.isDark ? '#FFFFFF' : '#1B1B1D' },
        },
        tickfont: { color: theme.isDark ? '#FFFFFF' : '#1B1B1D' },
      },
      yaxis: {
        ...layout.yaxis,
        gridcolor: theme.isDark ? '#333333' : '#E0E0E0',
        linecolor: theme.isDark ? '#333333' : '#E0E0E0',
        tickcolor: theme.isDark ? '#333333' : '#E0E0E0',
        title: {
          ...layout.yaxis?.title,
          font: { color: theme.isDark ? '#FFFFFF' : '#1B1B1D' },
        },
        tickfont: { color: theme.isDark ? '#FFFFFF' : '#1B1B1D' },
      },
      // Ensure secondary y-axis is themed too
      yaxis2: {
        ...layout.yaxis2,
        gridcolor: theme.isDark ? '#333333' : '#E0E0E0',
        linecolor: theme.isDark ? '#333333' : '#E0E0E0',
        tickcolor: theme.isDark ? '#333333' : '#E0E0E0',
        title: {
          ...layout.yaxis2?.title,
          font: { color: theme.isDark ? '#FFFFFF' : '#1B1B1D' },
        },
        tickfont: { color: theme.isDark ? '#FFFFFF' : '#1B1B1D' },
      },
    });

    // Get processed plot data (spoofed or real, with colors)
    const getProcessedPlotData = (): PlotData[] => {
      if (!forecastData?.plot_data) return [];

      let processedData = forecastData.plot_data;

      // ============================================================================
      // DATA SPOOFING SECTION - REMOVE THIS ENTIRE BLOCK TO DISABLE SPOOFING
      // ============================================================================
      if (!showRealData) {
        processedData = spoofRecentData(processedData);
      }
      // ============================================================================
      // END DATA SPOOFING SECTION
      // ============================================================================

      // Apply different colors for real data
      if (showRealData) {
        processedData = modifyColorsForRealData(processedData);
      }

      return processedData;
    };

    return (
      <Card.Root width='100%' mt={6} bg='bg.canvas'>
        <Card.Body p={6}>
          <VStack gap={6} align='stretch'>
            {/* Header */}
            <HStack justify='space-between' align='center'>
              <Heading as='h2' size='lg' color='fg'>
                Source Plot
              </Heading>

              {/* ============================================================================ */}
              {/* DATA SPOOFING TOGGLE - REMOVE THIS ENTIRE HSTACK TO DISABLE SPOOFING UI */}
              {/* ============================================================================ */}
              <HStack gap={2} align='center' opacity={0.7}>
                <Button
                  size='xs'
                  variant='ghost'
                  onClick={() => setShowRealData(!showRealData)}
                  fontSize='xs'
                  color='fg.muted'
                  _hover={{ color: 'fg' }}
                >
                  {showRealData ? 'Raw' : 'Forecast'}
                </Button>
              </HStack>
              {/* ============================================================================ */}
              {/* END DATA SPOOFING TOGGLE */}
              {/* ============================================================================ */}
            </HStack>

            {/* Type Selection Buttons */}
            <HStack gap={2} wrap='wrap'>
              {(Object.keys(infoTexts) as ForecastType[]).map((type) => (
                <HStack key={type} gap={1}>
                  <Button
                    size='sm'
                    onClick={() => handleTypeChange(type)}
                    bg={selectedType === type ? 'fg' : 'bg.canvas'}
                    color={selectedType === type ? 'bg.canvas' : 'fg'}
                    borderWidth='1px'
                    borderStyle='solid'
                    borderColor={
                      selectedType === type ? 'fg' : 'border.emphasized'
                    }
                    _hover={{
                      bg: selectedType === type ? 'fg' : 'bg.hover',
                      color: selectedType === type ? 'bg.canvas' : 'fg',
                      opacity: selectedType === type ? 0.9 : 1,
                    }}
                  >
                    {type}
                  </Button>
                  <Popover.Root>
                    <Popover.Trigger asChild>
                      <IconButton
                        size='sm'
                        variant='ghost'
                        aria-label={`Info about ${type}`}
                      >
                        <FiInfo size={14} />
                      </IconButton>
                    </Popover.Trigger>
                    <Popover.Positioner>
                      <Popover.Content>
                        <Popover.Arrow />
                        <Popover.Body>
                          <Text fontSize='sm' maxW='300px'>
                            {infoTexts[type]}
                          </Text>
                        </Popover.Body>
                      </Popover.Content>
                    </Popover.Positioner>
                  </Popover.Root>
                </HStack>
              ))}
            </HStack>

            {/* Graph */}
            <ChartErrorBoundary
              chartName={`${selectedType} Forecast Chart`}
              fallbackHeight='400px'
            >
              {loadingChart ? (
                <Box
                  height='400px'
                  display='flex'
                  alignItems='center'
                  justifyContent='center'
                >
                  <VStack gap={2}>
                    <Spinner size='lg' />
                    <Text color='gray.500'>Loading chart data...</Text>
                  </VStack>
                </Box>
              ) : forecastData ? (
                <Plot
                  data={getProcessedPlotData() as Data[]}
                  layout={
                    getThemedPlotLayout({
                      ...forecastData.plot_layout,
                      autosize: true,
                      height: 400,
                      // Ensure both y-axes are configured
                      yaxis: {
                        ...forecastData.plot_layout.yaxis,
                        side: 'left',
                      },
                      yaxis2: {
                        ...forecastData.plot_layout.yaxis2,
                        side: 'right',
                        overlaying: 'y',
                        title: 'Sentiment Score',
                      },
                    }) as Partial<Layout>
                  }
                  style={{ width: '100%', height: '400px' }}
                  config={{
                    displayModeBar: true,
                    displaylogo: false,
                    modeBarButtonsToRemove: [
                      'pan2d',
                      'lasso2d',
                      'select2d',
                      'autoScale2d',
                      'hoverClosestCartesian',
                      'hoverCompareCartesian',
                      'toggleSpikelines',
                    ],
                  }}
                />
              ) : (
                <Box
                  height='400px'
                  display='flex'
                  alignItems='center'
                  justifyContent='center'
                >
                  <Text color='gray.500'>No chart data available</Text>
                </Box>
              )}
            </ChartErrorBoundary>

            {/* Table Section */}
            <VStack gap={4} align='stretch'>
              {/* Table Controls */}
              <HStack justify='space-between' wrap='wrap'>
                <HStack gap={2}>
                  <Text fontSize='sm' color='gray.600'>
                    Show:
                  </Text>
                  <select
                    value={pagination.pageSize}
                    onChange={(e) =>
                      handlePageSizeChange(Number(e.target.value))
                    }
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #E2E8F0',
                      fontSize: '14px',
                    }}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <Text fontSize='sm' color='gray.600'>
                    entries
                  </Text>
                </HStack>
              </HStack>

              {/* Table */}
              <Box position='relative'>
                {loading && (
                  <Box
                    position='absolute'
                    top='0'
                    left='0'
                    right='0'
                    bottom='0'
                    bg='rgba(255,255,255,0.8)'
                    display='flex'
                    alignItems='center'
                    justifyContent='center'
                    zIndex='1'
                  >
                    <Spinner size='lg' />
                  </Box>
                )}

                <Table.Root size='sm'>
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader width='80px'>Year</Table.ColumnHeader>
                      <Table.ColumnHeader>
                        Name & Description
                      </Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {tableData && tableData.data.length > 0 ? (
                      tableData.data.map((row, index) => (
                        <Table.Row key={index}>
                          <Table.Cell>
                            <div dangerouslySetInnerHTML={{ __html: row[0] }} />
                          </Table.Cell>
                          <Table.Cell>
                            <Box
                              overflow='hidden'
                              display='-webkit-box'
                              style={{
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical',
                              }}
                              title={row[1]?.replace(/<[^>]*>/g, '')}
                            >
                              <div
                                dangerouslySetInnerHTML={{ __html: row[1] }}
                              />
                            </Box>
                          </Table.Cell>
                        </Table.Row>
                      ))
                    ) : (
                      <Table.Row>
                        <Table.Cell colSpan={2}>
                          <Text textAlign='center' color='gray.500'>
                            {loading ? 'Loading...' : 'No data available'}
                          </Text>
                        </Table.Cell>
                      </Table.Row>
                    )}
                  </Table.Body>
                </Table.Root>
              </Box>

              {/* Table Info and Pagination */}
              {tableData && (
                <HStack justify='space-between'>
                  <Text fontSize='sm' color='gray.600'>
                    Showing {currentStart} to {currentEnd} of{' '}
                    {tableData.recordsFiltered} entries
                    {pagination.searchTerm &&
                      ` (filtered from ${tableData.recordsTotal} total entries)`}
                  </Text>

                  {/* Pagination Controls */}
                  <HStack gap={2}>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 0}
                    >
                      Previous
                    </Button>
                    <Text fontSize='sm' color='gray.600'>
                      Page {pagination.page + 1} of {totalPages}
                    </Text>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= totalPages - 1}
                    >
                      Next
                    </Button>
                  </HStack>
                </HStack>
              )}
            </VStack>
          </VStack>
        </Card.Body>
      </Card.Root>
    );
  }
);

ForecastChart.displayName = 'ForecastChart';

export default ForecastChart;
