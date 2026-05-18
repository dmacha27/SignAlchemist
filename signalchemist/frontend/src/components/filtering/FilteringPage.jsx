import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { usePapaParse } from "react-papaparse";
import { useTranslation } from "react-i18next";
import { FaFilter, FaSignal, FaTools } from "react-icons/fa";
import toast from "react-hot-toast";

import SignalTabs from "../common/SignalTabs";
import InfoMetrics from "../common/InfoMetrics";
import DownloadSignal from "../common/DownloadSignal";
import InfoTable from "../common/InfoTable";
import FilterFields from "../common/FilterFields";
import LoaderMessage from "../common/LoaderMessage";
import SignalSummary from "../common/SignalSummary";
import {
  WorkspacePage,
  WorkspaceHero,
  WorkspaceSection,
  WorkspaceCard,
  WorkspaceInnerCard,
  WorkspaceEmptyState,
  WorkspacePrimaryButton,
} from "../workspace/WorkspaceShell";
import {
  buildUtilitySourceData,
  requestSignalMetrics,
} from "../workspace/utilityData";
import { requestFiltering } from "../processing/processingRequests";
import {
  createFilterDefaults,
  getTranslatedFieldDefinitions,
  getFilterOptions,
} from "./filteringConfig";
import { FormFieldLabel, uiSelectClass } from "../common/ui";

const FilteringPage = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const { file, signalType, timestampColumn, samplingRate, signalValues } =
    location.state || {};
  const { readString } = usePapaParse();

  const [isRequesting, setIsRequesting] = useState(false);
  const [headers, setHeaders] = useState([]);
  const [chartDataOriginal, setChartDataOriginal] = useState(null);
  const [chartDataFiltered, setChartDataFiltered] = useState(null);
  const [metricsOriginal, setMetricsOriginal] = useState(null);
  const [metricsFiltered, setMetricsFiltered] = useState(null);
  const [filter, setFilter] = useState("butterworth");

  const defaultFields = useMemo(
    () => createFilterDefaults(samplingRate),
    [samplingRate]
  );

  const [fields, setFields] = useState(() => defaultFields[filter]);

  useEffect(() => {
    if (!file) {
      return;
    }

    const loadOriginalData = async () => {
      try {
        const sourceData = await buildUtilitySourceData({
          file,
          readString,
          timestampColumn,
          signalValues,
          samplingRate,
        });

        setHeaders(sourceData.headers);
        setChartDataOriginal(sourceData.chartData);

        const metrics = await requestSignalMetrics({
          signal: sourceData.chartData,
          signalType,
          samplingRate,
        });
        setMetricsOriginal(metrics);
      } catch (error) {
        console.error(error.message);
        toast.error(error.message);
      }
    };

    loadOriginalData();
  }, [file, readString, timestampColumn, signalValues, samplingRate, signalType]);

  const requestFilter = async () => {
    if (!chartDataOriginal) {
      return;
    }

    if (filter === "python" && !fields.python?.trim()) {
      toast.error(t("pages.filtering.pythonRequired"));
      return;
    }

    setIsRequesting(true);

    try {
      const payload = await requestFiltering({
        signal: chartDataOriginal.slice(1),
        samplingRate,
        filterConfig: {
          method: filter,
          ...fields,
        },
      });

      const filteredData = [
        [headers[timestampColumn], headers[signalValues]],
        ...payload.data,
      ];

      setChartDataFiltered(filteredData);

      const metrics = await requestSignalMetrics({
        signal: filteredData,
        signalType,
        samplingRate,
      });
      setMetricsFiltered(metrics);
    } catch (error) {
      setChartDataFiltered(null);
      setMetricsFiltered(null);
      console.error("Error performing filtering:", error);
      toast.error(error.message || t("pages.filtering.error"));
    } finally {
      setIsRequesting(false);
    }
  };

  const handleFieldChange = (fieldName, nextValue) => {
    setFields((previousFields) => ({
      ...previousFields,
      [fieldName]: nextValue,
    }));
  };

  return (
    <WorkspacePage>
      <WorkspaceHero
        icon={<FaFilter />}
        title={t("pages.filtering.title")}
        description={t("pages.filtering.description")}
        badge={t("common.signalTypeBadge", { signalType })}
        action={<SignalSummary table={chartDataOriginal} />}
      />

      <WorkspaceSection className="grid items-start gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.7fr)_minmax(0,0.95fr)]">
        <WorkspaceCard
          title={t("pages.filtering.originalTitle")}
          description={t("pages.filtering.inputDescription")}
          icon={<FaSignal />}
        >
          {chartDataOriginal ? (
            <InfoTable table={chartDataOriginal} onlyTable={true} />
          ) : (
            <WorkspaceEmptyState message={t("common.noData")} />
          )}
        </WorkspaceCard>

        <WorkspaceCard
          title={t("pages.filtering.settingsTitle")}
          description={t("pages.filtering.settingsDescription")}
          icon={<FaTools />}
          className="xl:sticky xl:top-4 xl:self-start"
        >
          <WorkspaceInnerCard>
            <div className="space-y-4">
              <FormFieldLabel
                htmlFor="filterTechnique"
                label={t("pages.filtering.technique")}
                tooltip={t("pages.filtering.techniqueTooltip")}
              />
              <select
                id="filterTechnique"
                data-testid="Select filter"
                value={filter}
                onChange={(event) => {
                  const value = event.target.value;
                  if (value) {
                    setFilter(value);
                    setFields(defaultFields[value]);
                  }
                }}
                className={uiSelectClass}
              >
                {getFilterOptions(t).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <FilterFields
                filter={filter}
                fields={fields}
                fieldDefinitions={getTranslatedFieldDefinitions(filter, t)}
                onFieldChange={handleFieldChange}
              />

              <WorkspacePrimaryButton
                className="w-full"
                onClick={requestFilter}
              >
                <FaFilter />
                {t("pages.filtering.apply")}
              </WorkspacePrimaryButton>
            </div>
          </WorkspaceInnerCard>
        </WorkspaceCard>

        <WorkspaceCard
          title={t("pages.filtering.resultTitle")}
          description={t("pages.filtering.outputDescription")}
          icon={<FaFilter />}
        >
          {isRequesting ? (
            <LoaderMessage message={t("common.processingRequest")} />
          ) : chartDataFiltered ? (
            <>
              <InfoTable table={chartDataFiltered} onlyTable={true} />
              <DownloadSignal table={chartDataFiltered} name="filtered" />
            </>
          ) : (
            <WorkspaceEmptyState message={t("pages.filtering.resultEmpty")} />
          )}
        </WorkspaceCard>
      </WorkspaceSection>

      <WorkspaceSection>
        <SignalTabs
          rightTitle={t("pages.filtering.rightTitle")}
          rightIcon={<FaFilter className="my-auto text-emerald-500" />}
          chartDataOriginal={chartDataOriginal}
          chartDataProcessed={chartDataFiltered}
          isRequesting={isRequesting}
        />
      </WorkspaceSection>

      {signalType !== "OTHER" && (
        <WorkspaceSection>
          <InfoMetrics
            metricsOriginal={metricsOriginal}
            metricsProcessed={metricsFiltered}
            isRequesting={isRequesting}
          />
        </WorkspaceSection>
      )}
    </WorkspacePage>
  );
};

export default FilteringPage;
