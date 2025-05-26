import PropTypes from "prop-types";
import {
  FaClock,
  FaSpinner,
  FaCheck,
  FaExclamationCircle,
} from "react-icons/fa";

/**
 * ExecutionIcon component renders an icon based on the execution state.
 * It displays different icons depending on the state: waiting, running, executed, or error.
 *
 * @param {Object} props - The properties passed to the component.
 * @param {string} props.executionState - The state of the execution, which can be one of the following:
 *                                          'waiting', 'running', 'executed', or 'error'.
 *                                          If the state is not one of these values, no icon is shown.
 */
const ExecutionIcon = ({ executionState }) => {
  const icons = {
    waiting: <FaClock className="text-muted dark:text-white" />,
    running: <FaSpinner className="spin text-primary dark:text-white" />,
    executed: <FaCheck className="text-success dark:text-white" />,
    error: <FaExclamationCircle className="text-danger dark:text-white" />,
  };

  return icons[executionState] || null;
};

ExecutionIcon.propTypes = {
  executionState: PropTypes.oneOf(["waiting", "running", "executed", "error"])
    .isRequired,
};

export default ExecutionIcon;
