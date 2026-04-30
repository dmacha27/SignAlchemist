import PropTypes from "prop-types";
import { FaArrowRight } from "react-icons/fa";
import { getNodeDefinition } from "../processing/nodeRegistry";

const capitalize = (str) => {
  if (typeof str !== "string" || str.length === 0) {
    return "";
  }

  return str.charAt(0).toUpperCase() + str.slice(1);
};

const getTechniqueInfo = (node) => {
  if (!node.data?.technique) {
    return null;
  }

  try {
    const parsed = JSON.parse(node.data.technique);
    const techniqueName = parsed.name ?? parsed.detector ?? parsed.method ?? null;
    if (!techniqueName) {
      return null;
    }

    const fields = parsed.fields ?? {};
    if (parsed.detector) {
      fields.detector = parsed.detector;
    }
    if (parsed.minDistanceSeconds !== undefined && parsed.minDistanceSeconds !== "") {
      fields.minDistanceSeconds = parsed.minDistanceSeconds;
    }
    if (parsed.height !== undefined && parsed.height !== "") {
      fields.height = parsed.height;
    }
    return {
      name: techniqueName,
      fields,
    };
  } catch {
    return null;
  }
};

const TechniqueFields = ({ fields }) => (
  <div className="mt-2 flex flex-wrap gap-1.5">
    {Object.entries(fields).map(([key, value]) => {
      const valueStr = String(value);
      const isLong = valueStr.length > 30;

      return (
        <div
          key={key}
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-600 dark:border-gray-700 dark:bg-gray-950 dark:text-slate-300"
        >
          <span className="font-semibold">{capitalize(key)}:</span>
          {isLong ? (
            <details className="dropdown dropdown-end">
              <summary className="cursor-pointer list-none text-xs font-medium">
                View
              </summary>
              <div className="dropdown-content z-20 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-lg dark:border-gray-700 dark:bg-gray-900">
                <p className="break-words">{valueStr}</p>
              </div>
            </details>
          ) : (
            <span>{valueStr}</span>
          )}
        </div>
      );
    })}
  </div>
);

const PipelineSteps = ({ nodes }) => {
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return <p>No steps to display.</p>;
  }

  const dictNodes = {};
  nodes.forEach((element) => {
    if (element?.id) {
      dictNodes[element.id] = element;
    }
  });

  const connectedNodes = [];
  const visited = new Set();
  let currentNodeId = "1";

  while (currentNodeId && !visited.has(currentNodeId)) {
    const current = dictNodes[currentNodeId];
    if (!current) break;

    connectedNodes.push(current);
    visited.add(currentNodeId);
    currentNodeId = current.data?.target;
  }

  return (
    <div className="rounded-[1.35rem] bg-white p-4 dark:bg-gray-900">
      <div className="flex flex-wrap items-stretch gap-3">
        {connectedNodes.map((node, index) => {
          const definition =
            getNodeDefinition(node.type) ?? getNodeDefinition("OutputSignal");
          const SummaryIcon = definition?.summaryIcon ?? definition?.icon;
          const techniqueObj = getTechniqueInfo(node);

          return (
            <div key={node.id} className="flex items-center gap-3">
              <article className="min-w-[220px] max-w-[280px] rounded-[1.15rem] bg-slate-50 p-3 dark:bg-slate-950">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-400">
                      Step {index + 1}
                    </div>
                    <div className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${definition?.summaryTone ?? ""}`}>
                      {SummaryIcon ? <SummaryIcon size={13} /> : null}
                      {definition?.summaryLabel ?? node.type}
                    </div>
                  </div>
                </div>

                {techniqueObj ? (
                  <div className="mt-3">
                    <div className="text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                      Technique
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                      {capitalize(techniqueObj.name)}
                    </div>
                    {techniqueObj.fields ? (
                      <TechniqueFields fields={techniqueObj.fields} />
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                    {node.type === "InputSignal"
                      ? "Entry point of the pipeline."
                      : "Final output of the pipeline."}
                  </div>
                )}
              </article>

              {index < connectedNodes.length - 1 ? (
                <div className="hidden text-slate-300 dark:text-slate-600 md:block">
                  <FaArrowRight size={16} />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

TechniqueFields.propTypes = {
  fields: PropTypes.objectOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.bool,
      PropTypes.oneOf([null]),
    ])
  ).isRequired,
};

PipelineSteps.propTypes = {
  nodes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      data: PropTypes.object,
    })
  ).isRequired,
};

export default PipelineSteps;
