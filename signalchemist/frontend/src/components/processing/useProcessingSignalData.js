import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import {
  buildUtilitySourceData,
  requestSignalMetrics,
} from "../workspace/utilityData";

export const DEFAULT_PREVIEW_META = Object.freeze({
  annotationPoints: [],
  title: "Processed",
  iconKey: "signal",
  computeMetrics: true,
});

export function useProcessingSignalData({
  file,
  readString,
  timestampColumn,
  signalValues,
  samplingRate,
  signalType,
}) {
  const [chartDataOriginal, setChartDataOriginal] = useState(null);
  const [chartDataProcessed, setChartDataProcessed] = useState(null);
  const [previewMeta, setPreviewMeta] = useState(DEFAULT_PREVIEW_META);
  const [metricsOriginal, setMetricsOriginal] = useState(null);
  const [metricsProcessed, setMetricsProcessed] = useState(null);

  const handleRequestError = useCallback((error, fallbackMessage) => {
    const message = error?.message || fallbackMessage;
    console.error(message);
    toast.error(message);
  }, []);

  const resetProcessedPreview = useCallback(() => {
    setChartDataProcessed(null);
    setPreviewMeta(DEFAULT_PREVIEW_META);
    setMetricsProcessed(null);
  }, []);

  const showProcessedPreview = useCallback((table, annotationPoints = [], options = {}) => {
    setChartDataProcessed(table ?? null);
    setPreviewMeta({
      annotationPoints,
      title: options.title ?? DEFAULT_PREVIEW_META.title,
      iconKey: options.iconKey ?? DEFAULT_PREVIEW_META.iconKey,
      computeMetrics: options.computeMetrics ?? DEFAULT_PREVIEW_META.computeMetrics,
    });
  }, []);

  useEffect(() => {
    if (!file) {
      setChartDataOriginal(null);
      setMetricsOriginal(null);
      resetProcessedPreview();
      return;
    }

    let isCancelled = false;

    const loadOriginalData = async () => {
      try {
        const sourceData = await buildUtilitySourceData({
          file,
          readString,
          timestampColumn,
          signalValues,
          samplingRate,
        });

        if (isCancelled) {
          return;
        }

        setChartDataOriginal(sourceData.chartData);

        const metrics = await requestSignalMetrics({
          signal: sourceData.chartData,
          signalType,
          samplingRate,
        });

        if (!isCancelled) {
          setMetricsOriginal(metrics);
        }
      } catch (error) {
        if (!isCancelled) {
          handleRequestError(error, "Could not load the original signal");
        }
      }
    };

    loadOriginalData();

    return () => {
      isCancelled = true;
    };
  }, [
    file,
    handleRequestError,
    readString,
    resetProcessedPreview,
    samplingRate,
    signalType,
    signalValues,
    timestampColumn,
  ]);

  useEffect(() => {
    if (!chartDataProcessed || !previewMeta.computeMetrics) {
      setMetricsProcessed(null);
      return;
    }

    let isCancelled = false;

    requestSignalMetrics({
      signal: chartDataProcessed,
      signalType,
      samplingRate,
    })
      .then((metrics) => {
        if (!isCancelled) {
          setMetricsProcessed(metrics);
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          handleRequestError(error, "Could not calculate processed metrics");
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [
    chartDataProcessed,
    handleRequestError,
    previewMeta.computeMetrics,
    samplingRate,
    signalType,
  ]);

  return {
    chartDataOriginal,
    chartDataProcessed,
    previewMeta,
    metricsOriginal,
    metricsProcessed,
    resetProcessedPreview,
    showProcessedPreview,
  };
}
