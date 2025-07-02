import React from "react";
import { FaTrash } from "react-icons/fa";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
} from "@xyflow/react";

function ButtonEdge({
  id,
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

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          strokeWidth: 2,
          stroke: "#0d6dfd",
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
          <div
            onClick={onEdgeClick}
            className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded w-8 h-8 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <FaTrash data-testid="FaTrash" className="text-red-500" />
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default ButtonEdge;
