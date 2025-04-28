import React from 'react';
import { FaTrash } from 'react-icons/fa';

import {
    BaseEdge,
    EdgeLabelRenderer,
    getBezierPath,
    useReactFlow,
} from '@xyflow/react';

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
                    stroke: '#0d6dfd',
                }}
            />
            <EdgeLabelRenderer>
                <div
                    className="position-absolute"
                    style={{
                        pointerEvents: 'all',
                        transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                        transformOrigin: 'center',
                    }}
                >
                    <div
                        onClick={onEdgeClick}
                        className="d-flex align-items-center justify-content-center bg-light border rounded"
                        style={{
                            width: '32px',
                            height: '32px',
                            cursor: 'pointer',
                        }}
                    >
                        <FaTrash className="text-danger" />
                    </div>
                </div>
            </EdgeLabelRenderer>
        </>
    );
}

export default ButtonEdge;
