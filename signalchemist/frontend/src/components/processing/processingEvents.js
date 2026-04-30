export const START_EXECUTE_EVENT = "start-execute";
export const ROOT_DELETE_EVENT = "delete-source-tables0";

export function getExecuteEventName(nodeId) {
  return `execute-node${nodeId}`;
}

export function getDeleteTablesEventName(nodeId) {
  return `delete-source-tables${nodeId}`;
}

export function dispatchWindowEvent(name, detail) {
  window.dispatchEvent(new CustomEvent(name, detail ? { detail } : undefined));
}
