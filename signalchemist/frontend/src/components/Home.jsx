import { useContext, useEffect, useState } from "react";
import "react-range-slider-input/dist/style.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "driver.js/dist/driver.css";

import { useNavigate } from "react-router-dom";
import { usePapaParse } from "react-papaparse";

import { ThemeContext } from "../contexts/ThemeContext";
import DatasetConfigurationCard from "./dataset/DatasetConfigurationCard";
import {
  buildChartPreview,
  buildCroppedUtilityFile,
  normalizeSamplingRateInput,
} from "./home/homeUtils";
import { startHomeTour } from "./home/homeTour";
import {
  HomeHero,
  CSVUploader,
  NextStepCard,
  PreviewWorkspaceCard,
  SignalPreviewCard,
} from "./home/HomeSections";
import {
  buildBatchNavigationState,
  buildDatasetPreparationChecks,
  buildUtilityNavigationState,
  hasPreparedDataset,
} from "./workspace/workspaceState";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Home = () => {
  const navigate = useNavigate();
  const { readString } = usePapaParse();
  const { isDarkMode: isDark } = useContext(ThemeContext);

  const [file, setFile] = useState(null);
  const [signalType, setSignalType] = useState("");
  const [timestampColumn, setTimestampColumn] = useState(-1);
  const [signalValues, setSignalValues] = useState(-1);
  const [samplingRate, setSamplingRate] = useState(null);
  const [fileRows, setFileRows] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [chartDataOriginal, setChartDataOriginal] = useState(null);
  const [cropValues, setCropValues] = useState(null);
  const [previewCropValues, setPreviewCropValues] = useState(null);

  useEffect(() => {
    window.history.replaceState({}, "");
  }, []);

  useEffect(() => {
    const preview = buildChartPreview({
      fileRows,
      headers,
      timestampColumn,
      signalValues,
      samplingRate,
      cropValues: previewCropValues,
    });

    if (!preview) {
      setChartDataOriginal(null);
      return;
    }

    if (
      preview.calculatedSamplingRate !== null &&
      preview.calculatedSamplingRate !== samplingRate
    ) {
      setSamplingRate(preview.calculatedSamplingRate);
    }

    setChartDataOriginal(preview.chartDataOriginal);
  }, [
    fileRows,
    headers,
    timestampColumn,
    signalValues,
    samplingRate,
    previewCropValues,
  ]);

  const resetDataset = () => {
    setFile(null);
    setSignalType("");
    setTimestampColumn(-1);
    setSignalValues(-1);
    setSamplingRate(null);
    setFileRows(null);
    setHeaders([]);
    setChartDataOriginal(null);
    setCropValues(null);
    setPreviewCropValues(null);
  };

  const handleDatasetLoaded = (dataset) => {
    setFile(dataset.file);
    setSignalType(dataset.signalType);
    setTimestampColumn(dataset.timestampColumn);
    setSignalValues(dataset.signalValues);
    setSamplingRate(dataset.samplingRate);
    setFileRows(dataset.fileRows);
    setHeaders(dataset.headers);
    setChartDataOriginal(dataset.chartDataOriginal);
    setCropValues(dataset.cropValues);
    setPreviewCropValues(null);
  };

  const currentDatasetState = {
    file,
    signalType,
    timestampColumn,
    signalValues,
    samplingRate,
  };
  const canLaunchUtility = hasPreparedDataset(currentDatasetState);
  const nextStepChecks = buildDatasetPreparationChecks(currentDatasetState);

  const launchUtility = async (path) => {
    if (path === "/batch") {
      navigate(path, {
        state: buildBatchNavigationState(currentDatasetState),
      });
      return;
    }

    if (!canLaunchUtility) {
      return;
    }

    const preparedFile = await buildCroppedUtilityFile({
      file,
      cropValues,
      readString,
    });

    navigate(path, {
      state: buildUtilityNavigationState({
        ...currentDatasetState,
        file: preparedFile || file,
      }),
    });
  };

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="mx-auto max-w-7xl">
        <HomeHero isDark={isDark} onStartTour={startHomeTour} />

        <section
          id="workspace"
          className="mt-6"
        >
          <div className="mx-auto mb-6 h-px w-16 rounded-full bg-cyan-300/90 dark:bg-cyan-700/80" />
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)]">
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <CSVUploader
                  onDatasetLoaded={handleDatasetLoaded}
                  onDatasetCleared={resetDataset}
                />

                <DatasetConfigurationCard
                  signalType={signalType}
                  timestampColumn={timestampColumn}
                  signalValues={signalValues}
                  samplingRate={samplingRate}
                  headers={headers}
                  onSignalTypeChange={setSignalType}
                  onTimestampChange={setTimestampColumn}
                  onSignalValuesChange={setSignalValues}
                  onSamplingRateChange={(value) =>
                    setSamplingRate(normalizeSamplingRateInput(value))
                  }
                />
              </div>

              <NextStepCard
                canLaunchUtility={canLaunchUtility}
                checks={nextStepChecks}
                onLaunchUtility={launchUtility}
              />
            </div>

            <div className="space-y-6">
              <PreviewWorkspaceCard>
                <SignalPreviewCard
                  chartDataOriginal={chartDataOriginal}
                  fileRows={fileRows}
                  headers={headers}
                  timestampColumn={timestampColumn}
                  signalValues={signalValues}
                  cropValues={cropValues}
                  onCropChange={setCropValues}
                  onApplyCrop={() => setPreviewCropValues(cropValues)}
                  hasAppliedCrop={
                    !!previewCropValues &&
                    !!cropValues &&
                    previewCropValues[0] === cropValues[0] &&
                    previewCropValues[1] === cropValues[1]
                  }
                />
              </PreviewWorkspaceCard>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
