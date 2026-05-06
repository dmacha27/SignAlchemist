import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { usePapaParse } from "react-papaparse";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  FaChartLine,
  FaExpandAlt,
  FaSignal,
  FaTools,
} from "react-icons/fa";

import DownloadSignal from "../common/DownloadSignal";
import InfoTable from "../common/InfoTable";
import SignalTabs from "../common/SignalTabs";
import LoaderMessage from "../common/LoaderMessage";
import {
  WorkspacePage,
  WorkspaceHero,
  WorkspaceSection,
  WorkspaceCard,
  WorkspaceInnerCard,
  WorkspaceEmptyState,
  WorkspacePrimaryButton,
} from "../workspace/WorkspaceShell";
import { buildUtilitySourceData } from "../workspace/utilityData";
import { FormFieldLabel } from "../common/ui";
import { requestResampling } from "../processing/processingRequests";

const ResamplingPage = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const { file, signalType, timestampColumn, samplingRate, signalValues } =
    location.state || {};
  const { readString } = usePapaParse();

  const [isRequesting, setIsRequesting] = useState(false);
  const [headers, setHeaders] = useState([]);
  const [chartDataOriginal, setChartDataOriginal] = useState(null);
  const [chartDataResampled, setChartDataResampled] = useState(null);
  const [interpolation, setInterpolation] = useState("spline");
  const [newSamplingRate, setNewSamplingRate] = useState(samplingRate);

  useEffect(() => {
    if (!file) {
      return;
    }

    const loadOriginalData = async () => {
      const sourceData = await buildUtilitySourceData({
        file,
        readString,
        timestampColumn,
        signalValues,
        samplingRate,
      });

      setHeaders(sourceData.headers);
      setChartDataOriginal(sourceData.chartData);
    };

    loadOriginalData();
  }, [file, readString, timestampColumn, signalValues, samplingRate]);

  const requestResample = async () => {
    if (!chartDataOriginal) {
      return;
    }

    setIsRequesting(true);

    try {
      const payload = await requestResampling({
        signal: chartDataOriginal.slice(1),
        interpolationTechnique: interpolation,
        targetSamplingRate: newSamplingRate,
      });

      setChartDataResampled([
        [headers[timestampColumn], headers[signalValues]],
        ...payload.data,
      ]);
    } catch (error) {
      console.error("Error performing resampling:", error);
      toast.error(error.message || t("pages.resampling.error", { defaultValue: "Error performing resampling." }));
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <WorkspacePage>
      <WorkspaceHero
        icon={<FaChartLine />}
        title={t("pages.resampling.title")}
        description={t("pages.resampling.description")}
        badge={t("common.signalTypeBadge", { signalType })}
      />

      <WorkspaceSection className="grid items-start gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.7fr)_minmax(0,0.95fr)]">
        <WorkspaceCard
          title={t("pages.resampling.originalTitle")}
          description={t("pages.resampling.inputDescription")}
          icon={<FaSignal />}
        >
          {chartDataOriginal ? (
            <InfoTable table={chartDataOriginal} onlyTable={false} />
          ) : (
            <WorkspaceEmptyState message={t("common.noData")} />
          )}
        </WorkspaceCard>

        <WorkspaceCard
          title={t("pages.resampling.settingsTitle")}
          description={t("pages.resampling.settingsDescription")}
          icon={<FaTools />}
          className="xl:sticky xl:top-4 xl:self-start"
        >
          <WorkspaceInnerCard>
            <div className="space-y-4">
              <div>
                <FormFieldLabel
                  htmlFor="interpTechnique"
                  label={t("pages.resampling.interpolationTechnique")}
                  tooltip={t("pages.resampling.interpolationTooltip")}
                />
                <select
                  id="interpTechnique"
                  className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                  onChange={(event) => setInterpolation(event.target.value)}
                  value={interpolation}
                >
                  <option value="spline">Spline</option>
                  <option value="1d">Interp1d</option>
                </select>
              </div>

              <div>
                <FormFieldLabel
                  htmlFor="samplingRate"
                  label={t("pages.resampling.newSamplingRate")}
                  tooltip={t("pages.resampling.newSamplingRateTooltip")}
                />
                <input
                  type="number"
                  step={1}
                  min={1}
                  id="samplingRate"
                  value={newSamplingRate}
                  onChange={(event) => {
                    setNewSamplingRate(parseInt(event.target.value));
                  }}
                  onBlur={(event) => {
                    const value = parseInt(event.target.value);
                    event.target.value = value;
                    if (isNaN(value) || value < 1) {
                      event.target.value = 1;
                      setNewSamplingRate(1);
                    }
                  }}
                  placeholder={t("pages.resampling.enterHz")}
                  className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
                />
              </div>

              <WorkspacePrimaryButton
                className="w-full"
                onClick={requestResample}
              >
                <FaExpandAlt />
                {t("pages.resampling.apply")}
              </WorkspacePrimaryButton>
            </div>
          </WorkspaceInnerCard>
        </WorkspaceCard>

        <WorkspaceCard
          title={t("pages.resampling.resultTitle")}
          description={t("pages.resampling.outputDescription")}
          icon={<FaChartLine />}
        >
          {isRequesting ? (
            <LoaderMessage message={t("common.processingRequest")} />
          ) : chartDataResampled ? (
            <>
              <InfoTable table={chartDataResampled} onlyTable={false} />
              <DownloadSignal table={chartDataResampled} name="resampled" />
            </>
          ) : (
            <WorkspaceEmptyState message={t("pages.resampling.resultEmpty")} />
          )}
        </WorkspaceCard>
      </WorkspaceSection>

      <WorkspaceSection>
        <SignalTabs
          rightTitle={t("pages.resampling.rightTitle")}
          rightIcon={<FaExpandAlt className="my-auto text-emerald-500" />}
          chartDataOriginal={chartDataOriginal}
          chartDataProcessed={chartDataResampled}
          isRequesting={isRequesting}
        />
      </WorkspaceSection>
    </WorkspacePage>
  );
};

export default ResamplingPage;
