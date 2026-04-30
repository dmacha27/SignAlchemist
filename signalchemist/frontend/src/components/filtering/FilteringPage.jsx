import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { usePapaParse } from "react-papaparse";
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
  filterDefinitions,
  getFilterOptions,
} from "./filteringConfig";
import { FormFieldLabel, uiSelectClass } from "../common/ui";

const FilteringPage = () => {
  const location = useLocation();
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

  const [fields, setFields] = useState(defaultFields[filter]);

  useEffect(() => {
    setFields(defaultFields[filter]);
  }, [defaultFields, filter]);

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
      toast.error(error.message || "Error performing filtering.");
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
        title="Filtering"
        description="Apply a filter to the signal."
        badge={`Signal type: ${signalType}`}
        action={<SignalSummary table={chartDataOriginal} />}
      />

      <WorkspaceSection className="grid items-start gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.7fr)_minmax(0,0.95fr)]">
        <WorkspaceCard
          title="Original Signal"
          description="Input signal."
          icon={<FaSignal />}
        >
          {chartDataOriginal ? (
            <InfoTable table={chartDataOriginal} onlyTable={true} />
          ) : (
            <WorkspaceEmptyState message="No data available" />
          )}
        </WorkspaceCard>

        <WorkspaceCard
          title="Settings"
          description="Filter type and parameters."
          icon={<FaTools />}
          className="xl:sticky xl:top-4 xl:self-start"
        >
          <WorkspaceInnerCard>
            <div className="space-y-4">
              <FormFieldLabel
                htmlFor="filterTechnique"
                label="Filtering technique"
                tooltip="Select the family of filter you want to apply to the signal."
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
                {getFilterOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <FilterFields
                filter={filter}
                fields={fields}
                fieldDefinitions={filterDefinitions[filter].fields}
                onFieldChange={handleFieldChange}
              />

              <WorkspacePrimaryButton
                className="w-full"
                onClick={requestFilter}
              >
                <FaFilter />
                Apply filter
              </WorkspacePrimaryButton>
            </div>
          </WorkspaceInnerCard>
        </WorkspaceCard>

        <WorkspaceCard
          title="Filtered Signal"
          description="Output signal."
          icon={<FaFilter />}
        >
          {isRequesting ? (
            <LoaderMessage message="Processing request..." />
          ) : chartDataFiltered ? (
            <>
              <InfoTable table={chartDataFiltered} onlyTable={true} />
              <DownloadSignal table={chartDataFiltered} name="filtered" />
            </>
          ) : (
            <WorkspaceEmptyState message="Run filtering to see the result." />
          )}
        </WorkspaceCard>
      </WorkspaceSection>

      <WorkspaceSection>
        <SignalTabs
          rightTitle="Filtered"
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
