import { useCallback } from "react";
import toast from "react-hot-toast";

import { PIPELINE_PRESETS } from "./pipelinePresets";

function readPipelineFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read pipeline file"));
    reader.readAsText(file);
  });
}

export function useProcessingPipelineIO({
  signalType,
  nodes,
  edges,
  buildBaseNodes,
  buildEdge,
  buildNodeData,
  getExportableNodeData,
  importableNodeTypes,
  setNodes,
  setEdges,
  setLastId,
  resetProcessedPreview,
  importInputRef,
}) {
  const exportPipeline = useCallback(() => {
    const payload = {
      signalType,
      nodes: nodes
        .filter((node) => node.id !== "1" && node.id !== "2")
        .map((node) => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: getExportableNodeData(node),
        })),
      edges: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
      })),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = downloadUrl;
    link.download = `signalchemist-pipeline-${signalType.toLowerCase()}.json`;
    link.click();

    window.URL.revokeObjectURL(downloadUrl);
  }, [edges, getExportableNodeData, nodes, signalType]);

  const importPipeline = useCallback(() => {
    importInputRef.current?.click();
  }, [importInputRef]);

  const applyPipelineDefinition = useCallback((parsed, successMessage) => {
    if (!Array.isArray(parsed?.nodes) || !Array.isArray(parsed?.edges)) {
      throw new Error("Invalid pipeline file");
    }

    const importedNodes = parsed.nodes
      .filter(
        (node) =>
          node &&
          node.id !== "1" &&
          node.id !== "2" &&
          importableNodeTypes.includes(node.type)
      )
      .map((node) => ({
        id: String(node.id),
        type: node.type,
        position: node.position ?? { x: 500, y: 120 },
        data: buildNodeData(node.type, node.data),
      }));

    const validNodeIds = new Set(["1", "2", ...importedNodes.map((node) => node.id)]);
    const importedEdges = parsed.edges
      .filter(
        (edge) =>
          edge &&
          validNodeIds.has(String(edge.source)) &&
          validNodeIds.has(String(edge.target))
      )
      .map((edge) =>
        buildEdge({
          id: edge.id ?? `xy-edge__${edge.source}-${edge.target}`,
          source: String(edge.source),
          target: String(edge.target),
        })
      );

    const nextNodes = [...buildBaseNodes(), ...importedNodes];
    const maxId = nextNodes.reduce((highest, node) => {
      const numericId = Number.parseInt(node.id, 10);
      return Number.isNaN(numericId) ? highest : Math.max(highest, numericId);
    }, 2);

    setNodes(nextNodes);
    setEdges(importedEdges);
    resetProcessedPreview();
    setLastId(maxId);

    if (successMessage) {
      toast.success(successMessage);
    }
  }, [
    buildBaseNodes,
    buildEdge,
    buildNodeData,
    importableNodeTypes,
    resetProcessedPreview,
    setEdges,
    setLastId,
    setNodes,
  ]);

  const handleImportPipeline = useCallback(async (event) => {
    const fileToImport = event.target.files?.[0];
    event.target.value = "";

    if (!fileToImport) {
      return;
    }

    try {
      const raw = await readPipelineFile(fileToImport);
      const parsed = JSON.parse(raw);

      if (!Array.isArray(parsed?.nodes) || !Array.isArray(parsed?.edges)) {
        throw new Error("Invalid pipeline file");
      }

      applyPipelineDefinition(parsed, "Pipeline imported");
    } catch (error) {
      console.error(error.message);
      toast.error("Invalid pipeline file");
    }
  }, [applyPipelineDefinition]);

  const applyRecommendedPipeline = useCallback((presetKey) => {
    const preset = PIPELINE_PRESETS[presetKey];
    if (!preset) {
      return;
    }

    applyPipelineDefinition(preset, `${presetKey} pipeline loaded`);
  }, [applyPipelineDefinition]);

  return {
    exportPipeline,
    importPipeline,
    applyPipelineDefinition,
    handleImportPipeline,
    applyRecommendedPipeline,
  };
}
