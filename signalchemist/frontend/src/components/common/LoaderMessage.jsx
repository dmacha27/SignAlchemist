import { memo } from "react";
import PropTypes from "prop-types";
/**
 * LoaderMessage component displays a loading spinner and a custom message.
 *
 * @param {Object} props - The props for the component.
 * @param {string} props.message - The message to display below the loading spinner.
 */
const LoaderMessage = memo(({ message }) => (
  <div className="flex min-h-[140px] flex-col items-center justify-center gap-3 bg-base-100/85 px-6 py-8 text-center text-base-content">
    <span
      className="loading loading-spinner loading-lg text-cyan-500"
      aria-hidden="true"
    ></span>
    <div className="space-y-1">
      <p className="text-sm font-semibold text-base-content">{message}</p>
    </div>
  </div>
));

LoaderMessage.propTypes = {
  message: PropTypes.string.isRequired,
};

export default LoaderMessage;
