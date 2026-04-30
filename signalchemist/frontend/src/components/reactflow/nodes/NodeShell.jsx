import PropTypes from "prop-types";
import { FaEye, FaTrash } from "react-icons/fa";

import ExecutionIcon from "../../common/ExecutionIcon";
import { FormFieldLabel, SimpleTooltip } from "../../common/ui";

const accentStyles = {
  cyan: {
    badge:
      "bg-cyan-500/12 text-cyan-700 ring-cyan-500/20 dark:bg-cyan-400/12 dark:text-cyan-200 dark:ring-cyan-400/20",
    icon: "text-cyan-600 dark:text-cyan-300",
    button:
      "bg-cyan-600 text-white hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-400",
  },
  emerald: {
    badge:
      "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20 dark:bg-emerald-400/12 dark:text-emerald-200 dark:ring-emerald-400/20",
    icon: "text-emerald-600 dark:text-emerald-300",
    button:
      "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400",
  },
  amber: {
    badge:
      "bg-amber-500/12 text-amber-700 ring-amber-500/20 dark:bg-amber-400/12 dark:text-amber-200 dark:ring-amber-400/20",
    icon: "text-amber-600 dark:text-amber-300",
    button:
      "bg-amber-500 text-slate-950 hover:bg-amber-400 dark:bg-amber-400 dark:hover:bg-amber-300",
  },
  violet: {
    badge:
      "bg-violet-500/12 text-violet-700 ring-violet-500/20 dark:bg-violet-400/12 dark:text-violet-200 dark:ring-violet-400/20",
    icon: "text-violet-600 dark:text-violet-300",
    button:
      "bg-violet-600 text-white hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-400",
  },
  rose: {
    badge:
      "bg-rose-500/12 text-rose-700 ring-rose-500/20 dark:bg-rose-400/12 dark:text-rose-200 dark:ring-rose-400/20",
    icon: "text-rose-600 dark:text-rose-300",
    button:
      "bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-400",
  },
  slate: {
    badge:
      "bg-slate-500/12 text-slate-700 ring-slate-500/20 dark:bg-slate-400/12 dark:text-slate-200 dark:ring-slate-400/20",
    icon: "text-slate-600 dark:text-slate-300",
    button:
      "bg-slate-900 text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200",
  },
};

const StatusPill = ({ executionState, onClick }) => (
  <SimpleTooltip label={executionState}>
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      aria-label="show execution status"
    >
      <ExecutionIcon executionState={executionState} />
    </button>
  </SimpleTooltip>
);

StatusPill.propTypes = {
  executionState: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};

const IconAction = ({
  label,
  title,
  icon,
  onClick,
  className = "",
  dataTestId,
}) => (
  <SimpleTooltip label={label}>
    <button
      type="button"
      title={title}
      data-testid={dataTestId}
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-gray-800 dark:hover:text-white ${className}`.trim()}
      aria-label={label}
    >
      {icon}
    </button>
  </SimpleTooltip>
);

IconAction.propTypes = {
  label: PropTypes.string.isRequired,
  title: PropTypes.string,
  icon: PropTypes.node.isRequired,
  onClick: PropTypes.func.isRequired,
  className: PropTypes.string,
  dataTestId: PropTypes.string,
};

IconAction.defaultProps = {
  title: undefined,
  className: "",
  dataTestId: undefined,
};

export const NodeShell = ({
  icon,
  title,
  eyebrow,
  accent = "slate",
  executionState,
  onStatusClick,
  onDeleteClick,
  deleteTestId,
  children,
  footer,
}) => {
  const palette = accentStyles[accent] ?? accentStyles.slate;

  return (
    <div className="min-w-[320px] rounded-[1.2rem] border border-slate-200 bg-white p-3.5 shadow-sm dark:border-gray-700 dark:bg-slate-950">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {eyebrow ? (
            <div className="mb-2">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ring-1 ${palette.badge}`}
              >
                {eyebrow}
              </span>
            </div>
          ) : null}
          <div className="flex items-center gap-2.5">
            <div className={`text-lg ${palette.icon}`}>{icon}</div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {title}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {executionState ? (
            <StatusPill
              executionState={executionState}
              onClick={onStatusClick}
            />
          ) : null}
          {onDeleteClick ? (
            <IconAction
              label="Delete node"
              icon={<FaTrash size={14} />}
              onClick={onDeleteClick}
              dataTestId={deleteTestId}
              className="text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:text-rose-300 dark:hover:bg-rose-500/10 dark:hover:text-rose-200"
            />
          ) : null}
        </div>
      </div>

      <div className="mt-3 space-y-2.5">{children}</div>

      {footer ? <div className="mt-3">{footer}</div> : null}
    </div>
  );
};

NodeShell.propTypes = {
  icon: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  eyebrow: PropTypes.string,
  accent: PropTypes.string,
  executionState: PropTypes.string,
  onStatusClick: PropTypes.func,
  onDeleteClick: PropTypes.func,
  deleteTestId: PropTypes.string,
  children: PropTypes.node.isRequired,
  footer: PropTypes.node,
};

NodeShell.defaultProps = {
  eyebrow: null,
  accent: "slate",
  executionState: null,
  onStatusClick: undefined,
  onDeleteClick: undefined,
  deleteTestId: undefined,
  footer: null,
};

export const NodeSection = ({
  label,
  tooltip,
  fieldId,
  children,
  compact = false,
}) => (
  <div
    className={`rounded-[0.95rem] bg-slate-50/80 ${compact ? "p-3" : "p-3.5"} dark:bg-slate-900/80`}
  >
    {label ? (
      <div className="mb-2">
        <FormFieldLabel
          htmlFor={fieldId}
          label={label}
          tooltip={tooltip}
          className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
        />
      </div>
    ) : null}
    {children}
  </div>
);

NodeSection.propTypes = {
  label: PropTypes.string,
  tooltip: PropTypes.string,
  fieldId: PropTypes.string,
  children: PropTypes.node.isRequired,
  compact: PropTypes.bool,
};

NodeSection.defaultProps = {
  label: null,
  tooltip: null,
  fieldId: undefined,
  compact: false,
};

export const NodeRunButton = ({ children, disabled, onClick, accent = "slate" }) => {
  const palette = accentStyles[accent] ?? accentStyles.slate;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-50 ${palette.button}`}
    >
      {children}
    </button>
  );
};

NodeRunButton.propTypes = {
  children: PropTypes.node.isRequired,
  disabled: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  accent: PropTypes.string,
};

NodeRunButton.defaultProps = {
  disabled: false,
  accent: "slate",
};

export const NodeOutputPreview = ({
  ready,
  rows,
  onClick,
  accent = "slate",
}) => {
  const palette = accentStyles[accent] ?? accentStyles.slate;

  if (!ready) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-2 dark:border-gray-800">
      <div className="min-w-0 text-[11px] text-slate-500 dark:text-slate-400">
        <span className="font-semibold text-slate-700 dark:text-slate-200">
          View ready
        </span>
        {` · ${rows} rows`}
      </div>
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${palette.button}`}
      >
        <FaEye size={11} />
        See
      </button>
    </div>
  );
};

NodeOutputPreview.propTypes = {
  ready: PropTypes.bool.isRequired,
  rows: PropTypes.number,
  onClick: PropTypes.func.isRequired,
  accent: PropTypes.string,
};

NodeOutputPreview.defaultProps = {
  rows: 0,
  accent: "slate",
};

export const NodeDataTable = ({ headers, rows, emptyMessage }) => {
  if (!rows || rows.length === 0) {
    return (
      <div className="rounded-[0.95rem] bg-slate-50 px-4 py-6 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[0.95rem] ring-1 ring-slate-200/80 dark:ring-gray-700/80">
      <div className="max-h-[245px] overflow-auto">
        <table className="min-w-full table-auto">
          <thead className="sticky top-0 bg-slate-100 dark:bg-slate-900">
            <tr>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Row
              </th>
              {headers.map((header) => (
                <th
                  key={header}
                  className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={`${row[0]}-${index}`}
                className="border-t border-slate-200 odd:bg-white even:bg-slate-50 dark:border-gray-800 dark:odd:bg-slate-950 dark:even:bg-slate-900"
              >
                <td className="px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  {index + 1}
                </td>
                {row.map((value, valueIndex) => (
                  <td
                    key={`${valueIndex}-${value}`}
                    className="px-3 py-2 text-sm text-slate-700 dark:text-slate-200"
                  >
                    {typeof value === "number" ? value.toFixed(4) : value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

NodeDataTable.propTypes = {
  headers: PropTypes.arrayOf(PropTypes.string).isRequired,
  rows: PropTypes.arrayOf(PropTypes.array).isRequired,
  emptyMessage: PropTypes.string,
};

NodeDataTable.defaultProps = {
  emptyMessage: "Waiting for data...",
};
