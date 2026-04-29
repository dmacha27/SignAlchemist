import PropTypes from "prop-types";

export const ChartFrame = ({
  badge,
  title,
  description,
  stats = [],
  toolbar,
  canvas,
  controls,
  notice,
}) => (
  <div className="py-1">
    <section className="overflow-hidden rounded-[0.95rem] border border-slate-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-950">
      {badge || title || description || stats.length || toolbar ? (
        <div className="flex flex-col gap-2 border-b border-slate-200 px-3 pt-2 pb-1.5 dark:border-gray-800 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 flex-1">
            {badge ? (
              <span className="text-[9px] font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                {badge}
              </span>
            ) : null}
            {title ? (
              <h3 className="truncate text-[11px] font-medium text-slate-700 dark:text-slate-200">
                {title}
              </h3>
            ) : null}
            {description ? (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{description}</p>
            ) : null}
          </div>

          <div className="flex w-full flex-wrap items-center justify-end gap-2 md:w-auto md:flex-nowrap md:self-start">
            {stats.length ? (
              <div className="hidden flex-wrap items-center gap-1.5 md:flex">
                {stats.map((stat) => (
                  <span
                    key={stat.label}
                    className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-600 dark:border-gray-700 dark:bg-gray-950 dark:text-slate-300"
                  >
                    {stat.label}: <span className="text-slate-900 dark:text-white">{stat.value}</span>
                  </span>
                ))}
              </div>
            ) : null}
            {toolbar ? <div className="flex w-full justify-end md:w-auto">{toolbar}</div> : null}
          </div>
        </div>
      ) : null}

      <div className="px-2 pb-2 pt-2">
        <div className="relative">
          {canvas}
          {notice ? (
            <div className="pointer-events-none absolute left-2 top-2 z-10 rounded-full border border-amber-300 bg-white/92 px-2 py-0.5 text-[10px] text-amber-700 dark:border-amber-500/40 dark:bg-slate-950/85 dark:text-amber-200">
              {notice}
            </div>
          ) : null}
        </div>
      </div>

      {controls ? (
        <div className="border-t border-slate-200 px-2.5 py-2 dark:border-gray-800">
          {controls}
        </div>
      ) : null}
    </section>
  </div>
);

ChartFrame.propTypes = {
  badge: PropTypes.string,
  title: PropTypes.string,
  description: PropTypes.string,
  stats: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    })
  ).isRequired,
  toolbar: PropTypes.node,
  canvas: PropTypes.node.isRequired,
  controls: PropTypes.node,
  notice: PropTypes.node,
};

ChartFrame.defaultProps = {
  badge: null,
  title: null,
  description: null,
  toolbar: null,
  controls: null,
  notice: null,
};
