import { FaClock, FaSpinner, FaCheck, FaExclamationCircle } from 'react-icons/fa';

const ExecutionIcon = ({ executionState }) => {
    switch (executionState) {
        case 'waiting':
            return <FaClock />;
        case 'running':
            return <FaSpinner className="spin" />;
        case 'executed':
            return <FaCheck />;
        case 'error':
            return <FaExclamationCircle />;
        default:
            return null;
    }
};

export default ExecutionIcon;