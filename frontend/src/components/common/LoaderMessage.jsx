import { memo } from "react";
import PropTypes from 'prop-types';
/**
 * LoaderMessage component displays a loading spinner and a custom message.
 * 
 * @param {Object} props - The props for the component.
 * @param {string} props.message - The message to display below the loading spinner.
*/
const LoaderMessage = memo(({ message }) => (
  <div className="text-center">
    <span className="loader"></span>
    <p className="mt-2 text-gray-600 dark:text-gray-300">{message}</p>
  </div>
));

LoaderMessage.propTypes = {
  message: PropTypes.string.isRequired,
};

export default LoaderMessage;