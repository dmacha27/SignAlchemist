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
import {
  createFilterDefaults,
  filterDefinitions,
  getFilterOptions,
} from "./filteringConfig";
import { uiSelectClass } from "../common/ui";

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
      const formData = new FormData();
      formData.append("signal", JSON.stringify(chartDataOriginal.slice(1)));
      formData.append("sampling_rate", samplingRate);
      formData.append(
        "filter_config",
        JSON.stringify({
          method: filter,
          ...fields,
        })
      );

      const response = await fetch("/api/filtering", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();
      if (!response.ok) {
        setChartDataFiltered(null);
        setMetricsFiltered(null);
        console.error(payload.error);
        toast.error(payload.error);
        throw new Error(payload.error);
      }

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
      console.error("Error performing filtering:", error);
      toast.error("Error performing filtering.");
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
        description="Inspect the original signal, configure the filtering technique, and compare the filtered output before downloading it."
        badge={`Signal type: ${signalType}`}
        action={<SignalSummary table={chartDataOriginal} />}
      />

      <WorkspaceSection className="grid items-start gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.7fr)_minmax(0,0.95fr)]">
        <WorkspaceCard
          title="Original Signal"
          description="Source data prepared from the dataset you configured on Home."
          icon={<FaSignal />}
        >
          {chartDataOriginal ? (
            <InfoTable table={chartDataOriginal} onlyTable={true} />
          ) : (
            <WorkspaceEmptyState message="No data available" />
          )}
        </WorkspaceCard>

        <WorkspaceCard
          title="Filtering controls"
          description="Choose a filtering technique and adjust the parameters before executing the request."
          icon={<FaTools />}
          className="xl:sticky xl:top-4 xl:self-start"
        >
          <WorkspaceInnerCard>
            <div className="space-y-4">
              <label
                htmlFor="filterTechnique"
                className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300"
              >
                Filtering technique
              </label>
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
                Execute filter
              </WorkspacePrimaryButton>
            </div>
          </WorkspaceInnerCard>
        </WorkspaceCard>

        <WorkspaceCard
          title="Filtered Signal"
          description="The output generated by the selected filtering technique."
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
            <WorkspaceEmptyState message="Please run processing to see results." />
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
