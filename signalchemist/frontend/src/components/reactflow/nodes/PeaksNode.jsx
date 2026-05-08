import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Handle,
  Position,
  useNodeConnections,
  useNodesData,
  useReactFlow,
} from "@xyflow/react";
import { FaMountainSun } from "react-icons/fa6";
import toast from "react-hot-toast";
import { inferSamplingRate } from "../../utils/dataUtils";

import HandleLimit from "../edges/HandleLimit";
import {
  NodeOutputPreview,
  NodeRunButton,
  NodeSection,
  NodeShell,
} from "./NodeShell";
import {
  FormFieldLabel,
  uiInputClass,
  uiSelectClass,
} from "../../common/ui";
import {
  buildPeakMarkers,
  getDefaultDetector,
  getDefaultMinDistance,
  requestPeaksDetection,
} from "../../peaks/peaksShared";
import { parseTechniqueConfig } from "../../processing/processingNodeUtils";
import {
  dispatchWindowEvent,
  getDeleteTablesEventName,
  getExecuteEventName,
} from "../../processing/processingEvents";

function PeaksNode({ id, data }) {
  const { t } = useTranslation();
  const tableRef = useRef(null);
  const initialConfig = parseTechniqueConfig(data.technique, {
    detector: data.detector,
    minDistanceSeconds: data.minDistanceSeconds,
    height: data.height,
  });

  const { updateNodeData } = useReactFlow();
  const [sourceNodeId, setSourceNodeId] = useState(null);
  const [targetNodeId, setTargetNodeId] = useState(null);
  const [detector, setDetector] = useState(
    initialConfig?.detector ?? getDefaultDetector(data.signalType)
  );
  const [minDistanceSeconds, setMinDistanceSeconds] = useState(
    initialConfig?.minDistanceSeconds ?? getDefaultMinDistance(data.signalType)
  );
  const [height, setHeight] = useState(initialConfig?.height ?? "");
  const [executionState, setExecutionState] = useState("waiting");

  const connections = useNodeConnections({ type: "target" });

  useEffect(() => {
    const sourceId = connections?.find((conn) => conn.target === id)?.source;
    const targetId = connections?.find((conn) => conn.source === id)?.target;
    setSourceNodeId(sourceId);
    setTargetNodeId(targetId);
  }, [connections, id]);

  const currentNodeData = useNodesData(id);
  const sourceNodeData = useNodesData(sourceNodeId);
  const incomingTable = sourceNodeData?.data?.table;
  const outputTable = currentNodeData?.data?.table;
  const peaks = useMemo(
    () => currentNodeData?.data?.peaks ?? [],
    [currentNodeData?.data?.peaks]
  );
  const peakMarkers = useMemo(() => buildPeakMarkers(peaks), [peaks]);

  useEffect(() => {
    tableRef.current = incomingTable ?? null;
  }, [incomingTable]);

  useEffect(() => {
    updateNodeData(id, (prev) => ({
      ...prev,
      technique: JSON.stringify({
        detector,
        minDistanceSeconds,
        height,
      }),
      target: targetNodeId,
      detector,
      minDistanceSeconds,
      height,
      executionState,
    }));
  }, [
    detector,
    executionState,
    height,
    id,
    minDistanceSeconds,
    targetNodeId,
    updateNodeData,
  ]);

  const requestPeaks = useCallback(async () => {
    const table = tableRef.current;
    if (!table) {
      return null;
    }

    setExecutionState("running");

    if (targetNodeId) {
      dispatchWindowEvent(getDeleteTablesEventName(targetNodeId));
    }

    try {
      const samplingRate = inferSamplingRate(table) ?? data.samplingRate;
      const detectedPeaks = await requestPeaksDetection({
        signal: table.slice(1),
        samplingRate,
        detector,
        signalType: data.signalType,
        minDistanceSeconds,
        height,
      });

      updateNodeData(id, (prev) => ({
        ...prev,
        table,
        peaks: detectedPeaks,
      }));

      setExecutionState("executed");
      return { table, peaks: detectedPeaks };
    } catch (error) {
      const message = error.message || "Failed to detect peaks";
      console.error(message);
      toast.error(message);
      setExecutionState("error");
      return null;
    }
  }, [
    data.samplingRate,
    data.signalType,
    detector,
    height,
    id,
    minDistanceSeconds,
    targetNodeId,
    updateNodeData,
  ]);

  useEffect(() => {
    const handleDeleteTable = () => {
      updateNodeData(id, (prev) => ({
        ...prev,
        table: null,
        peaks: [],
      }));

      setExecutionState("waiting");

      if (targetNodeId) {
        dispatchWindowEvent(getDeleteTablesEventName(targetNodeId));
      }
    };

    const handleExecute = async (event) => {
      const sourceTable = event.detail.table;

      if (sourceTable) {
        tableRef.current = sourceTable;

      const result = await requestPeaks();

        if (targetNodeId) {
          dispatchWindowEvent(getExecuteEventName(targetNodeId), {
            table: result?.table ?? sourceTable,
          });
        }
      }
    };

    window.addEventListener(getExecuteEventName(id), handleExecute);
    window.addEventListener(getDeleteTablesEventName(id), handleDeleteTable);

    return () => {
      window.removeEventListener(getExecuteEventName(id), handleExecute);
      window.removeEventListener(getDeleteTablesEventName(id), handleDeleteTable);
    };
  }, [id, requestPeaks, targetNodeId, updateNodeData]);

  useEffect(() => {
    dispatchWindowEvent(getDeleteTablesEventName(id));
  }, [detector, height, id, minDistanceSeconds]);

  return (
    <NodeShell
      icon={<FaMountainSun />}
      title={t("pages.peaks.title")}
      eyebrow={t("pipeline.eyebrow.analysis", { defaultValue: "Analysis" })}
      accent="rose"
      executionState={executionState}
      onStatusClick={() => {
        toast.custom(
          <div className="toast-status bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-black dark:text-white">
            <div>Status:</div>
            <div>{executionState}</div>
          </div>
        );
      }}
      onDeleteClick={() => {
        data.deleteNode(id);
      }}
      deleteTestId={`delete${id}`}
      footer={(
        <NodeRunButton
          disabled={!tableRef.current}
          onClick={requestPeaks}
          accent="rose"
        >
          {t("pages.peaks.detect")}
        </NodeRunButton>
      )}
    >
      <HandleLimit
        type="target"
        position={Position.Left}
        className="custom-handle"
        connectionCount={1}
      />

      <NodeSection
        label={t("pages.peaks.detector")}
        tooltip={t("pages.peaks.detectorTooltip")}
        fieldId="peaks-detector"
      >
        <select
          id="peaks-detector"
          value={detector}
          onChange={(event) => setDetector(event.target.value)}
          className={uiSelectClass}
        >
          <option value="neurokit">NeuroKit</option>
          <option value="scipy">SciPy</option>
        </select>
      </NodeSection>

      {detector === "neurokit" ? (
        <NodeSection compact>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {t("pages.peaks.neurokitHint")}
          </p>
        </NodeSection>
      ) : (
        <NodeSection compact>
          <div className="space-y-3">
            <div>
              <FormFieldLabel
                htmlFor="peaks-min-distance"
                label={t("pages.peaks.minDistance")}
                tooltip={t("pages.peaks.minDistanceTooltip")}
                className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
              />
              <input
                id="peaks-min-distance"
                type="number"
                min={0}
                step="0.01"
                value={minDistanceSeconds}
                onChange={(event) => setMinDistanceSeconds(event.target.value)}
                className={`mt-1 ${uiInputClass}`}
              />
            </div>

            <div>
              <FormFieldLabel
                htmlFor="peaks-min-height"
                label={t("pages.peaks.minHeight")}
                tooltip={t("pages.peaks.minHeightTooltip")}
                className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
              />
              <input
                id="peaks-min-height"
                type="number"
                step="0.01"
                placeholder={t("pages.peaks.optional")}
                value={height}
                onChange={(event) => setHeight(event.target.value)}
                className={`mt-1 ${uiInputClass}`}
              />
            </div>
          </div>
        </NodeSection>
      )}

      <NodeSection compact>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {t("pages.peaks.peakCount")}
          </span>
          <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {peaks.length}
          </span>
        </div>
      </NodeSection>

      <NodeOutputPreview
        ready={Boolean(outputTable)}
        rows={outputTable ? outputTable.length - 1 : 0}
        onClick={() => {
          if (outputTable) {
            data.showProcessedPreview(outputTable, peakMarkers);
          }
        }}
        accent="rose"
      />

      <Handle
        type="source"
        position={Position.Right}
        className="custom-handle"
      />
    </NodeShell>
  );
}

export default PeaksNode;
