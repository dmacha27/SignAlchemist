import PropTypes from "prop-types";
import {
  FaFilter,
  FaChevronDown,
  FaChevronUp,
  FaChartLine,
  FaBullseye,
  FaProjectDiagram,
  FaSquare,
  FaRocket,
  FaTrash,
  FaEye,
  FaFileExport,
  FaFileImport,
  FaMagic,
} from "react-icons/fa";
import {
  ReactFlow,
  MiniMap,
  Background,
  BackgroundVariant,
  Controls,
  Panel,
} from "@xyflow/react";

import LoaderMessage from "../common/LoaderMessage";
import PipelineSteps from "../common/PipelineSteps";
import {
  SimpleCollapse,
  SimpleConfirm,
  SimpleMenu,
} from "../common/ui";
import {
  WorkspaceCard,
  WorkspaceInnerCard,
  WorkspacePrimaryButton,
  WorkspaceSecondaryButton,
} from "../workspace/WorkspaceShell";

export const ProcessingFlowSection = ({
  chartDataOriginal,
  nodes,
  edges,
  edgeTypes,
  onNodesChange,
  onEdgesChange,
  nodeTypes,
  onConnect,
  isDark,
  isCanvasDragOver,
  onCanvasDragOver,
  onCanvasDragLeave,
  onCanvasDrop,
  exportPipeline,
  importPipeline,
  applyRecommendedPipeline,
}) => (
  <WorkspaceCard
    title="Pipeline Flow"
    description="Build a visual processing chain and inspect each transformation on the graph."
    icon={<FaProjectDiagram />}
    actions={(
      <div className="flex w-full flex-wrap items-center justify-end gap-2">
        <WorkspaceSecondaryButton
          title="Export pipeline"
          onClick={exportPipeline}
          className="px-3 py-2 text-xs"
        >
          <FaFileExport />
          Export
        </WorkspaceSecondaryButton>
        <WorkspaceSecondaryButton
          title="Import pipeline"
          onClick={importPipeline}
          className="px-3 py-2 text-xs"
        >
          <FaFileImport />
          Import
        </WorkspaceSecondaryButton>
        <SimpleMenu
          label="Recommended pipelines"
          widthClass="w-56"
          trigger={(
            <button
              type="button"
              title="Recommended pipelines"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-200 dark:hover:bg-gray-800"
            >
              <FaMagic />
              Presets
            </button>
          )}
          items={[
            {
              label: "EDA / GSR",
              icon: <FaMagic size={12} />,
              onClick: () => applyRecommendedPipeline("EDA"),
            },
            {
              label: "PPG",
              icon: <FaMagic size={12} />,
              onClick: () => applyRecommendedPipeline("PPG"),
            },
          ]}
        />
      </div>
    )}
  >
    <WorkspaceInnerCard className="p-0 overflow-hidden">
      {chartDataOriginal ? (
        <div
          className={`relative h-[560px] overflow-hidden rounded-[1rem] transition ${
            isCanvasDragOver
              ? "ring-2 ring-cyan-400 ring-offset-2 ring-offset-white dark:ring-cyan-500 dark:ring-offset-slate-950"
              : ""
          }`}
          onDragOver={onCanvasDragOver}
          onDragLeave={onCanvasDragLeave}
          onDrop={onCanvasDrop}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            edgeTypes={edgeTypes}
            connectionLineStyle={{
              stroke: isDark ? "#67e8f9" : "#0f172a",
              strokeWidth: 2,
            }}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            onConnect={onConnect}
            fitView
            minZoom={0.3}
            maxZoom={1.8}
            fitViewOptions={{ padding: 0.15 }}
            className="bg-slate-100 dark:bg-slate-950"
          >
            <Background
              color={isDark ? "rgba(71,85,105,0.55)" : "rgba(148,163,184,0.65)"}
              gap={20}
              size={1.2}
              variant={BackgroundVariant.Dots}
            />
            <Controls
              position="top-left"
              className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-950"
              showInteractive={false}
            />
            <Panel position="top-right">
              <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs font-medium text-slate-600 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-slate-950/95 dark:text-slate-300">
                Drop nodes here, connect them, then run the pipeline.
              </div>
            </Panel>
            <MiniMap
              nodeStrokeWidth={2}
              pannable
              position="bottom-left"
              nodeColor={(node) => {
                if (node.type === "InputSignal") return isDark ? "#22d3ee" : "#0891b2";
                if (node.type === "OutputSignal") return isDark ? "#34d399" : "#059669";
                if (node.type === "FilteringNode") return isDark ? "#34d399" : "#10b981";
                if (node.type === "ResamplingNode") return isDark ? "#38bdf8" : "#0284c7";
                if (node.type === "OutliersNode") return isDark ? "#fbbf24" : "#d97706";
                return isDark ? "#e5e7eb" : "#cbd5e1";
              }}
              maskColor={isDark ? "#020617a8" : "#f8fafcbf"}
              backgroundColor={isDark ? "#111827" : "#ffffff"}
            />
          </ReactFlow>
          {isCanvasDragOver ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-cyan-500/8">
              <div className="rounded-full border border-cyan-300 bg-white/95 px-4 py-2 text-sm font-semibold text-cyan-700 shadow-sm dark:border-cyan-700 dark:bg-slate-950/95 dark:text-cyan-300">
                Drop node
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <LoaderMessage message="Loading flow..." />
      )}
    </WorkspaceInnerCard>
  </WorkspaceCard>
);

export const ProcessingSidebar = ({
  samplingRate,
  addNode,
  onNodeDragStart,
  deleteSourceTablesAndExecute,
  confirmationOpened,
  setConfirmationOpened,
  cleanFlow,
  scrollToCharts,
}) => (
  <WorkspaceCard
    title="Pipeline Nodes"
    description="Add operations, execute the pipeline, or reset the current graph."
    icon={<FaSquare />}
    className="xl:sticky xl:top-4 xl:self-start"
  >
    <WorkspaceInnerCard>
      <div className="flex flex-col gap-3">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Click to add, or drag a node card into the canvas.
        </p>

        <button
          type="button"
          title="Add resampling node"
          draggable
          onDragStart={(event) => onNodeDragStart(event, "ResamplingNode")}
          onClick={() =>
            addNode("ResamplingNode", {
              samplingRate,
            })
          }
          className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100 active:scale-[0.99] dark:border-gray-700 dark:bg-gray-900 dark:text-slate-200 dark:hover:bg-gray-800"
        >
          <span className="inline-flex items-center gap-2">
            <FaChartLine />
            Resampling
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Drag
          </span>
        </button>

        <button
          type="button"
          title="Add outlier detection node"
          draggable
          onDragStart={(event) => onNodeDragStart(event, "OutliersNode")}
          onClick={() => addNode("OutliersNode")}
          className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100 active:scale-[0.99] dark:border-gray-700 dark:bg-gray-900 dark:text-slate-200 dark:hover:bg-gray-800"
        >
          <span className="inline-flex items-center gap-2">
            <FaBullseye />
            Outliers
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Drag
          </span>
        </button>

        <button
          type="button"
          title="Add filtering node"
          draggable
          onDragStart={(event) => onNodeDragStart(event, "FilteringNode")}
          onClick={() =>
            addNode("FilteringNode", {
              samplingRate,
            })
          }
          className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100 active:scale-[0.99] dark:border-gray-700 dark:bg-gray-900 dark:text-slate-200 dark:hover:bg-gray-800"
        >
          <span className="inline-flex items-center gap-2">
            <FaFilter />
            Filtering
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Drag
          </span>
        </button>

        <div className="my-1 border-t border-slate-200 dark:border-gray-700" />

        <WorkspacePrimaryButton
          title="Start-end execution"
          onClick={deleteSourceTablesAndExecute}
          className="w-full bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:text-white dark:hover:bg-red-700"
        >
          <FaRocket />
          Run Pipeline
        </WorkspacePrimaryButton>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setConfirmationOpened((openState) => !openState)}
            title="Restart flow"
            className="w-full rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700"
          >
            <span className="inline-flex items-center gap-2">
              <FaTrash />
              Clean Pipeline
            </span>
          </button>

          <SimpleConfirm
            open={confirmationOpened}
            title="Confirm reset"
            description="Are you sure you want to clean the pipeline?"
            onCancel={() => setConfirmationOpened(false)}
            onConfirm={() => {
              cleanFlow();
              setConfirmationOpened(false);
            }}
            confirmLabel="Yes, clean"
          />
        </div>

        <button
          title="Go to charts"
          onClick={scrollToCharts}
          className="mx-auto inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-200 dark:hover:bg-gray-800"
        >
          <FaEye />
          Charts
        </button>
      </div>
    </WorkspaceInnerCard>
  </WorkspaceCard>
);

export const ProcessingSteps = ({ opened, toggle, nodes }) => (
  <div className="mt-10">
    <div className="mx-auto mb-6 h-px w-16 rounded-full bg-cyan-300/90 dark:bg-cyan-700/80" />
    <div className="mb-3 flex items-center justify-between gap-3">
      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          Active pipeline
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Current connected path from input to output.
        </p>
      </div>
      <button
        type="button"
        onClick={toggle}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-200 dark:hover:bg-gray-800"
      >
        {opened ? "Hide" : "Show"}
        {opened ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
      </button>
    </div>

    <SimpleCollapse open={opened}>
      {nodes.length > 0 ? <PipelineSteps nodes={nodes} /> : null}
    </SimpleCollapse>
  </div>
);

ProcessingFlowSection.propTypes = {
  chartDataOriginal: PropTypes.array,
  nodes: PropTypes.array.isRequired,
  edges: PropTypes.array.isRequired,
  edgeTypes: PropTypes.object.isRequired,
  onNodesChange: PropTypes.func.isRequired,
  onEdgesChange: PropTypes.func.isRequired,
  nodeTypes: PropTypes.object.isRequired,
  onConnect: PropTypes.func.isRequired,
  isDark: PropTypes.bool.isRequired,
  isCanvasDragOver: PropTypes.bool.isRequired,
  onCanvasDragOver: PropTypes.func.isRequired,
  onCanvasDragLeave: PropTypes.func.isRequired,
  onCanvasDrop: PropTypes.func.isRequired,
  exportPipeline: PropTypes.func.isRequired,
  importPipeline: PropTypes.func.isRequired,
  applyRecommendedPipeline: PropTypes.func.isRequired,
};

ProcessingFlowSection.defaultProps = {
  chartDataOriginal: null,
};

ProcessingSidebar.propTypes = {
  samplingRate: PropTypes.number.isRequired,
  addNode: PropTypes.func.isRequired,
  onNodeDragStart: PropTypes.func.isRequired,
  deleteSourceTablesAndExecute: PropTypes.func.isRequired,
  confirmationOpened: PropTypes.bool.isRequired,
  setConfirmationOpened: PropTypes.func.isRequired,
  cleanFlow: PropTypes.func.isRequired,
  scrollToCharts: PropTypes.func.isRequired,
};

ProcessingSteps.propTypes = {
  opened: PropTypes.bool.isRequired,
  toggle: PropTypes.func.isRequired,
  nodes: PropTypes.array.isRequired,
};
