import { FaClock, FaSpinner, FaCheck, FaExclamationCircle } from 'react-icons/fa';

const ExecutionIcon = ({ executionState }) => {
    const icons = {
      waiting: <FaClock className="text-muted" />,
      running: <FaSpinner className="spin text-primary" />,
      executed: <FaCheck className="text-success" />,
      error: <FaExclamationCircle className="text-danger" />
    };
  
    return icons[executionState] || null;
  };

export default ExecutionIcon;