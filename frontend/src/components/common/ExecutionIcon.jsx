import { FaClock, FaSpinner, FaCheck, FaExclamationCircle } from 'react-icons/fa';

const ExecutionIcon = ({ executionState }) => {
    switch (executionState) {
        case 'waiting':
            return <FaClock title='Waiting' />;
        case 'running':
            return <FaSpinner className="spin" title='Running' />;
        case 'executed':
            return <FaCheck title='Executed' />;
        case 'error':
            return <FaExclamationCircle title='Error' />;
        default:
            return null;
    }
};

export default ExecutionIcon;