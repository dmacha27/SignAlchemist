import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import {
  FaChartBar,
  FaChartLine,
  FaFilter,
  FaHeartbeat,
  FaHome,
  FaPlus,
  FaProjectDiagram,
} from "react-icons/fa";

import {
  FaMountainSun,
} from "react-icons/fa6";

const FloatingNavMenu = ({ isDark, isOpen, onToggle, onNavigate, onNavigateHome }) => {
  const { t } = useTranslation();
  const actions = [
    { key: "resampling", icon: FaChartLine, path: "/resampling" },
    { key: "filtering", icon: FaFilter, path: "/filtering" },
    { key: "peaks", icon: FaMountainSun, path: "/peaks" },
    { key: "hr", icon: FaHeartbeat, path: "/hr" },
    { key: "processing", icon: FaProjectDiagram, path: "/processing", featured: true },
    { key: "batch", icon: FaChartBar, path: "/batch" },
  ];

  return <div className="fixed bottom-5 right-5 z-[1081]">
    <div className="relative flex w-44 flex-col items-end gap-2">
      {isOpen ? (
        <div className="flex flex-col items-end gap-2">
          {actions.map((action) => {
            const Icon = action.icon;
            const label = t(`nav.actions.${action.key}.label`);
            const description = t(`nav.actions.${action.key}.description`);
            const buttonClass = action.featured
              ? "group flex items-center gap-2 rounded-xl border border-amber-300/70 bg-amber-50/72 px-3 py-2 text-amber-900 shadow-[0_14px_24px_rgba(180,130,25,0.18)] backdrop-blur-md transition-colors hover:bg-amber-50/88 dark:border-amber-500/35 dark:bg-amber-500/12 dark:text-amber-100 dark:hover:bg-amber-500/18"
              : "group flex items-center gap-2 rounded-xl border border-slate-200/75 bg-white/72 px-3 py-2 text-slate-700 shadow-[0_12px_24px_rgba(15,23,42,0.12)] backdrop-blur-md transition-colors hover:bg-white/88 dark:border-gray-700/75 dark:bg-gray-900/72 dark:text-slate-100 dark:hover:bg-gray-900/86";
            const iconClass = action.featured
              ? "flex h-8 w-8 items-center justify-center rounded-lg bg-amber-200/72 text-[13px] text-amber-900 transition-colors group-hover:bg-amber-200/90 dark:bg-amber-400/18 dark:text-amber-100 dark:group-hover:bg-amber-400/26"
              : "flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100/90 text-[13px] text-slate-700 transition-colors group-hover:bg-slate-200/90 dark:bg-gray-800/90 dark:text-slate-100 dark:group-hover:bg-gray-700/90";
            const labelClass = action.featured
              ? "pr-1 text-[12px] font-semibold tracking-[0.01em]"
              : "pr-1 text-[12px] font-semibold";

            return (
              <div key={action.key}>
                <button
                  type="button"
                  data-testid={action.testId}
                  aria-label={label}
                  title={description}
                  onClick={() => onNavigate(action.path)}
                  className={buttonClass}
                >
                  <span className={iconClass}>
                    <Icon />
                  </span>
                  <span className={labelClass}>
                    {label}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        {onNavigateHome && (
          <button
            type="button"
            aria-label={t("nav.home")}
            title={t("nav.homeTitle")}
            onClick={onNavigateHome}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/75 bg-white/72 text-slate-700 shadow-[0_12px_24px_rgba(15,23,42,0.12)] backdrop-blur-md transition-colors hover:bg-white/88 dark:border-gray-700/75 dark:bg-gray-900/72 dark:text-slate-100 dark:hover:bg-gray-900/86"
          >
            <FaHome className="text-xs" />
          </button>
        )}
        <button
          type="button"
          aria-label={isOpen ? t("nav.close") : t("nav.open")}
          onClick={onToggle}
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200/75 bg-white/74 text-slate-800 shadow-[0_18px_36px_rgba(15,23,42,0.16)] backdrop-blur-md transition-transform dark:border-gray-700/75 dark:bg-gray-900/74 dark:text-slate-100"
          style={{
            transform: `rotate(${isOpen ? 45 : 0}deg)`,
            boxShadow: isDark
              ? "0 22px 45px rgba(2,6,23,0.42)"
              : "0 22px 45px rgba(15,23,42,0.22)",
          }}
        >
          <FaPlus className="text-sm" />
        </button>
      </div>
    </div>
  </div>;
};

FloatingNavMenu.propTypes = {
  isDark: PropTypes.bool.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  onNavigate: PropTypes.func.isRequired,
  onNavigateHome: PropTypes.func,
};

FloatingNavMenu.defaultProps = {
  onNavigateHome: null,
};

export default FloatingNavMenu;
