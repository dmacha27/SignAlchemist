import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";

const PAGE_CARD_CLASS =
  "rounded-[1.6rem] border border-slate-200/90 bg-white p-4 shadow-[0_18px_44px_rgba(15,23,42,0.07)] dark:border-gray-700 dark:bg-gray-900";

export const WorkspacePage = ({ children }) => (
  <div className="container mx-auto px-4 py-4">
    <div className="mx-auto max-w-7xl">{children}</div>
  </div>
);

export const WorkspaceHero = ({
  icon,
  title,
  description,
  badge,
  backTo = "/",
  action = null,
}) => (
  <header className="rounded-[1.75rem] border border-slate-200/90 bg-white px-5 py-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] dark:border-gray-700 dark:bg-gray-950 md:px-6">
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start">
      <div>
        <Link
          to={backTo}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-200 dark:hover:bg-gray-800"
        >
          <FaArrowLeft size={11} />
          Back to Home
        </Link>
        <div className="mt-4 flex items-center gap-3">
          <div className="text-[1.8rem] text-cyan-600 dark:text-cyan-400">
            {icon}
          </div>
          <div className="min-w-0">
            <h1 className="text-[1.35rem] font-semibold text-slate-900 dark:text-white md:text-[1.55rem]">
              {title}
            </h1>
            <p className="mt-1 max-w-3xl text-sm leading-5 text-slate-600 dark:text-slate-300">
              {description}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-3.5 dark:border-gray-700 dark:bg-gray-900">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
          Current Context
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white dark:bg-white dark:text-slate-900">
            {badge}
          </span>
        </div>
        {action ? (
          <div className="mt-4">{action}</div>
        ) : (
          <p className="mt-4 text-sm leading-5 text-slate-600 dark:text-slate-300">
            Review the original signal, configure the operation, and compare the
            result before downloading or continuing.
          </p>
        )}
      </div>
    </div>
  </header>
);

export const WorkspaceSection = ({ children, className = "" }) => (
  <section className="mt-6">
    <div className="mx-auto mb-6 h-px w-16 rounded-full bg-cyan-300/90 dark:bg-cyan-700/80" />
    <div className={className}>{children}</div>
  </section>
);

export const WorkspaceCard = ({ title, description, icon, children, className = "" }) => (
  <div className={`${PAGE_CARD_CLASS} ${className}`.trim()}>
    {(title || description || icon) && (
      <div className="mb-4 flex items-start gap-3">
        {icon ? (
          <div className="shrink-0 pt-0.5 text-lg text-cyan-600 dark:text-cyan-400">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0">
          {title ? (
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              {title}
            </h2>
          ) : null}
          {description ? (
            <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">
              {description}
            </p>
          ) : null}
        </div>
      </div>
    )}
    {children}
  </div>
);

export const WorkspaceInnerCard = ({ children, className = "" }) => (
  <div
    className={`rounded-[1rem] bg-slate-50/85 p-4 dark:bg-gray-950/60 ${className}`.trim()}
  >
    {children}
  </div>
);

export const WorkspaceEmptyState = ({ message }) => (
  <div className="rounded-[1.15rem] border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500 dark:border-gray-700 dark:text-slate-400">
    {message}
  </div>
);

export const WorkspacePrimaryButton = ({
  children,
  onClick,
  disabled = false,
  className = "",
  type = "button",
  title,
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 dark:disabled:bg-gray-800 dark:disabled:text-gray-500 ${className}`.trim()}
  >
    {children}
  </button>
);

export const WorkspaceSecondaryButton = ({
  children,
  onClick,
  className = "",
  title,
}) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    className={`inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-200 dark:hover:bg-gray-800 ${className}`.trim()}
  >
    {children}
  </button>
);

export const WorkspaceActionLink = ({ to, children }) => (
  <Link
    to={to}
    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
  >
    {children}
    <FaArrowRight size={12} />
  </Link>
);

WorkspacePage.propTypes = {
  children: PropTypes.node.isRequired,
};

WorkspaceHero.propTypes = {
  icon: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  badge: PropTypes.string.isRequired,
  backTo: PropTypes.string,
  action: PropTypes.node,
};

WorkspaceHero.defaultProps = {
  backTo: "/",
  action: null,
};

WorkspaceSection.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

WorkspaceSection.defaultProps = {
  className: "",
};

WorkspaceCard.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  icon: PropTypes.node,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

WorkspaceCard.defaultProps = {
  title: null,
  description: null,
  icon: null,
  className: "",
};

WorkspaceInnerCard.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

WorkspaceInnerCard.defaultProps = {
  className: "",
};

WorkspaceEmptyState.propTypes = {
  message: PropTypes.string.isRequired,
};

WorkspacePrimaryButton.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  type: PropTypes.string,
  title: PropTypes.string,
};

WorkspacePrimaryButton.defaultProps = {
  onClick: undefined,
  disabled: false,
  className: "",
  type: "button",
  title: undefined,
};

WorkspaceSecondaryButton.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  className: PropTypes.string,
  title: PropTypes.string,
};

WorkspaceSecondaryButton.defaultProps = {
  onClick: undefined,
  className: "",
  title: undefined,
};

WorkspaceActionLink.propTypes = {
  to: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};
