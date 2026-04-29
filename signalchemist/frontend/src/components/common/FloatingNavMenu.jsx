import PropTypes from "prop-types";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaChartLine,
  FaFilter,
  FaHome,
  FaPlus,
  FaProjectDiagram,
} from "react-icons/fa";

const actions = [
  {
    key: "resampling",
    label: "Resampling",
    description: "Open resampling tools",
    icon: FaChartLine,
    path: "/resampling",
  },
  {
    key: "filtering",
    label: "Filtering",
    description: "Open filters",
    icon: FaFilter,
    path: "/filtering",
  },
  {
    key: "processing",
    label: "Processing",
    description: "Open processing",
    icon: FaProjectDiagram,
    path: "/processing",
  },
];

const MotionDiv = motion.div;
const MotionButton = motion.button;

const FloatingNavMenu = ({ isDark, isOpen, onToggle, onNavigate, onNavigateHome }) => (
  <div className="fixed bottom-5 right-5 z-[1081]">
    <div className="relative flex w-44 flex-col items-end gap-2">
      <AnimatePresence>
        {isOpen ? (
          <MotionDiv
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: {
                type: "spring",
                stiffness: 380,
                damping: 28,
                staggerChildren: 0.035,
                delayChildren: 0.02,
              },
            }}
            exit={{
              opacity: 0,
              y: 16,
              scale: 0.97,
              transition: {
                duration: 0.16,
              },
            }}
            className="flex flex-col items-end gap-2"
          >
            {actions.map((action) => {
              const Icon = action.icon;

              return (
                <MotionDiv
                  key={action.key}
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.18 }}
                >
                  <button
                    type="button"
                    data-testid={action.testId}
                    aria-label={action.label}
                    title={action.description}
                    onClick={() => onNavigate(action.path)}
                    className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 shadow-[0_14px_24px_rgba(15,23,42,0.12)] transition hover:-translate-y-0.5 hover:bg-slate-50 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-100 dark:hover:bg-gray-800"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-[13px] text-slate-700 transition group-hover:bg-slate-200 dark:bg-gray-800 dark:text-slate-100 dark:group-hover:bg-gray-700">
                      <Icon />
                    </span>
                    <span className="pr-1 text-[12px] font-semibold">
                      {action.label}
                    </span>
                  </button>
                </MotionDiv>
              );
            })}
          </MotionDiv>
        ) : null}
      </AnimatePresence>

      <div className="flex items-center gap-2">
        {onNavigateHome && (
          <button
            type="button"
            aria-label="Go to Home"
            title="Reset and upload again"
            onClick={onNavigateHome}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            <FaHome className="text-xs" />
          </button>
        )}
        <MotionButton
          type="button"
          aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
          onClick={onToggle}
          animate={{
            rotate: isOpen ? 45 : 0,
            boxShadow: isDark
              ? "0 22px 45px rgba(2,6,23,0.42)"
              : "0 22px 45px rgba(15,23,42,0.22)",
          }}
          transition={{ type: "spring", stiffness: 350, damping: 22 }}
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900"
        >
          <FaPlus className="text-sm" />
        </MotionButton>
      </div>
    </div>
  </div>
);

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
