import { Popover, Text } from "@mantine/core";
import PropTypes from "prop-types";
import {
  FaArrowRight,
  FaBullseye,
  FaChartLine,
  FaFilter,
  FaSignInAlt,
  FaSignOutAlt,
} from "react-icons/fa";

const NODE_META = {
  InputSignal: {
    label: "InputSignal",
    icon: <FaSignInAlt size={13} />,
    tone:
      "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-200",
  },
  ResamplingNode: {
    label: "ResamplingNode",
    icon: <FaChartLine size={13} />,
    tone:
      "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200",
  },
  FilteringNode: {
    label: "FilteringNode",
    icon: <FaFilter size={13} />,
    tone:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200",
  },
  OutliersNode: {
    label: "OutliersNode",
    icon: <FaBullseye size={13} />,
    tone:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
  },
  OutputSignal: {
    label: "OutputSignal",
    icon: <FaSignOutAlt size={13} />,
    tone:
      "border-slate-200 bg-slate-50 text-slate-700 dark:border-gray-700 dark:bg-slate-900 dark:text-slate-200",
  },
};

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

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
            <Popover width={300} trapFocus position="bottom" withArrow shadow="md">
              <Popover.Target>
                <Text size="xs" className="cursor-pointer font-medium">
                  Click
                </Text>
              </Popover.Target>
              <Popover.Dropdown>
                <Text size="sm" className="break-words">
                  {valueStr}
                </Text>
              </Popover.Dropdown>
            </Popover>
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
    return <Text>No steps to display.</Text>;
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
          const meta = NODE_META[node.type] ?? NODE_META.OutputSignal;
          const techniqueObj = node.data?.technique
            ? JSON.parse(node.data.technique)
            : null;

          return (
            <div key={node.id} className="flex items-center gap-3">
              <article className="min-w-[220px] max-w-[280px] rounded-[1.15rem] bg-slate-50 p-3 dark:bg-slate-950">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-400">
                      Step {index + 1}
                    </div>
                    <div className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${meta.tone}`}>
                      {meta.icon}
                      {meta.label}
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
