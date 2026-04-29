import { cloneElement, isValidElement, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";

export const uiInputClass =
  "input input-bordered h-10 w-full rounded-xl border-slate-300 bg-white text-sm text-slate-900 shadow-sm outline-none transition focus:border-cyan-400 dark:border-gray-600 dark:bg-gray-900 dark:text-white";

export const uiCompactInputClass =
  "input input-bordered h-7 rounded-full border-slate-300 bg-white px-2.5 text-[10px] font-medium text-slate-800 placeholder:text-slate-400 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-200 dark:placeholder:text-slate-500";

export const uiSelectClass =
  "select select-bordered min-h-10 w-full rounded-xl border-slate-300 bg-white text-sm text-slate-900 shadow-sm outline-none transition focus:border-cyan-400 dark:border-gray-600 dark:bg-gray-900 dark:text-white";

export const uiButtonClass =
  "btn min-h-0 h-auto rounded-xl border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-none hover:bg-slate-100 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-200 dark:hover:bg-gray-800";

export const uiPrimaryButtonClass =
  "btn min-h-0 h-auto rounded-xl border-0 bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200";

export const uiGhostButtonClass =
  "btn btn-ghost min-h-0 h-auto rounded-full px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-none hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-gray-800";

export const SimpleTooltip = ({ label, children }) => (
  <div className="tooltip" data-tip={label}>
    {children}
  </div>
);

SimpleTooltip.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export const SimpleMenu = ({ trigger, label, items, widthClass = "w-44" }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const triggerNode = isValidElement(trigger)
    ? cloneElement(trigger, {
        onClick: (event) => {
          trigger.props.onClick?.(event);
          setOpen((current) => !current);
        },
        "aria-expanded": open,
      })
    : (
      <button type="button" onClick={() => setOpen((current) => !current)}>
        {trigger}
      </button>
    );

  return (
    <div ref={containerRef} className="relative shrink-0">
      {triggerNode}
      {open ? (
        <ul
          className={`menu absolute right-0 top-full z-[60] mt-2 rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-700 shadow-lg dark:border-gray-700 dark:bg-gray-900 dark:text-slate-200 ${widthClass}`.trim()}
        >
          {label ? (
            <li className="pointer-events-none px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
              {label}
            </li>
          ) : null}
          {items.map((item) => (
            <li key={item.label}>
              <button
                type="button"
                onClick={() => {
                  item.onClick();
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-gray-800"
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};

SimpleMenu.propTypes = {
  trigger: PropTypes.node.isRequired,
  label: PropTypes.string,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      icon: PropTypes.node,
      onClick: PropTypes.func.isRequired,
    })
  ).isRequired,
  widthClass: PropTypes.string,
};

SimpleMenu.defaultProps = {
  label: null,
  widthClass: "w-44",
};

export const SimpleDialog = ({ open, title, onClose, children }) => {
  if (!open) {
    return null;
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-3xl rounded-2xl border border-slate-200 bg-white p-0 text-slate-800 shadow-2xl dark:border-gray-700 dark:bg-gray-900 dark:text-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-gray-700">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm rounded-full"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
      <button
        type="button"
        className="modal-backdrop"
        onClick={onClose}
        aria-label="Close modal"
      >
        close
      </button>
    </div>
  );
};

SimpleDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};

export const SimplePagination = ({ page, totalPages, onChange }) => {
  if (totalPages <= 1) {
    return null;
  }

  const pages = [];
  const addPage = (value) => {
    if (!pages.includes(value) && value >= 1 && value <= totalPages) {
      pages.push(value);
    }
  };

  addPage(1);
  addPage(page - 1);
  addPage(page);
  addPage(page + 1);
  addPage(totalPages);

  const sortedPages = pages.sort((a, b) => a - b);
  const items = [];

  sortedPages.forEach((pageNumber, index) => {
    const previous = sortedPages[index - 1];
    if (previous && pageNumber - previous > 1) {
      items.push("ellipsis");
    }
    items.push(pageNumber);
  });

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        type="button"
        className="btn btn-sm min-h-0 h-8 rounded-lg px-3"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      >
        Prev
      </button>
      <div className="flex items-center gap-1">
        {items.map((item, index) => (
          item === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="px-1 text-sm font-semibold text-slate-400 dark:text-slate-500"
            >
              ...
            </span>
          ) : (
            <button
              key={item}
              type="button"
              className={`btn btn-sm min-h-0 h-8 min-w-8 rounded-lg px-2 ${
                item === page
                  ? "border-slate-900 bg-slate-900 text-white hover:bg-slate-700 dark:border-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-200 dark:hover:bg-gray-800"
              }`}
              onClick={() => onChange(item)}
            >
              {item}
            </button>
          )
        ))}
      </div>
      <button
        type="button"
        className="btn btn-sm min-h-0 h-8 rounded-lg px-3"
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
      >
        Next
      </button>
    </div>
  );
};

SimplePagination.propTypes = {
  page: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
};

export const SimpleCollapse = ({ open, children }) => (
  <div className={`grid transition-all duration-300 ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
    <div className="overflow-hidden">{children}</div>
  </div>
);

SimpleCollapse.propTypes = {
  open: PropTypes.bool.isRequired,
  children: PropTypes.node.isRequired,
};

export const SimpleConfirm = ({
  open,
  title,
  description,
  onCancel,
  onConfirm,
  confirmLabel = "Confirm",
}) => {
  if (!open) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-slate-800 shadow-md dark:border-gray-700 dark:bg-gray-900 dark:text-white">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        {description}
      </p>
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={uiButtonClass}>
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="btn min-h-0 h-auto rounded-xl border-0 bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-none hover:bg-red-700"
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
};

SimpleConfirm.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  confirmLabel: PropTypes.string,
};

SimpleConfirm.defaultProps = {
  confirmLabel: "Confirm",
};
