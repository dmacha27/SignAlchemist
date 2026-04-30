import React, { useMemo, useState } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
  useNodesData,
} from "@xyflow/react";
import {
  getNodeDefinition,
  INSERTABLE_NODE_TYPES,
  isInsertableNodeType,
} from "../../processing/nodeRegistry";

function ButtonEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}) {
  const { setEdges } = useReactFlow();
  const [menuOpen, setMenuOpen] = useState(false);
  const sourceNode = useNodesData(source);
  const targetNode = useNodesData(target);
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const onEdgeClick = () => {
    setEdges((edges) => edges.filter((edge) => edge.id !== id));
  };

  const executionState = useMemo(() => {
    const sourceState = sourceNode?.data?.executionState;
    const targetState = targetNode?.data?.executionState;

    if (sourceState === "error" || targetState === "error") return "error";
    if (sourceState === "running" || targetState === "running") return "running";
    if (sourceState === "executed") return "executed";
    return "idle";
  }, [sourceNode?.data?.executionState, targetNode?.data?.executionState]);

  const edgeTone =
    executionState === "running"
      ? "#f59e0b"
      : executionState === "executed"
        ? "#10b981"
        : executionState === "error"
          ? "#ef4444"
          : "#0f172a";

  const handleInsert = (nodeType) => {
    if (!isInsertableNodeType(nodeType)) {
      setMenuOpen(false);
      return;
    }

    window.dispatchEvent(
      new CustomEvent("insert-node-on-edge", {
        detail: {
          edgeId: id,
          sourceId: source,
          targetId: target,
          nodeType,
        },
      })
    );
    setMenuOpen(false);
  };

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          strokeWidth: executionState === "running" ? 2.8 : 2.2,
          stroke: edgeTone,
          strokeDasharray: executionState === "running" ? "7 5" : undefined,
          ...style,
        }}
        data-testid="BaseEdge"
      />
      <EdgeLabelRenderer>
        <div
          className="absolute"
          style={{
            pointerEvents: "all",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            transformOrigin: "center",
          }}
        >
          <div className="flex flex-col items-center gap-1.5">
            {menuOpen ? (
              <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-1.5 py-1 shadow-sm dark:border-gray-700 dark:bg-slate-950">
                {INSERTABLE_NODE_TYPES.map((nodeType) => {
                  const definition = getNodeDefinition(nodeType);
                  const Icon = definition?.icon;

                  return (
                    <button
                      key={nodeType}
                      type="button"
                      onClick={() => handleInsert(nodeType)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                      aria-label={definition?.insertAriaLabel}
                    >
                      {Icon ? <Icon size={12} /> : null}
                    </button>
                  );
                })}
              </div>
            ) : null}

            <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-1 py-1 shadow-sm dark:border-gray-700 dark:bg-slate-950">
              <span
                className={`ml-1 h-2.5 w-2.5 rounded-full ${
                  executionState === "running"
                    ? "bg-amber-400 animate-pulse"
                    : executionState === "executed"
                      ? "bg-emerald-500"
                      : executionState === "error"
                        ? "bg-rose-500"
                        : "bg-slate-300 dark:bg-slate-600"
                }`}
                aria-hidden="true"
              />
              <button
                type="button"
                onClick={() => setMenuOpen((current) => !current)}
                className="inline-flex h-7 items-center justify-center gap-1 rounded-full px-2 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label="insert node"
              >
                <FaPlus size={11} />
                Insert
              </button>
              <button
                type="button"
                onClick={onEdgeClick}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-rose-500 transition hover:bg-rose-50 hover:text-rose-600 dark:text-rose-300 dark:hover:bg-rose-500/10 dark:hover:text-rose-200"
                aria-label="delete edge"
              >
                <FaTrash data-testid="FaTrash" size={11} />
              </button>
            </div>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default ButtonEdge;
