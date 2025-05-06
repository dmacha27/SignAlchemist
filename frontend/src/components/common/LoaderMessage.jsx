const LoaderMessage = ({ message }) => (
    <div className="text-center">
      <span className="loader"></span>
      <p className="mt-2 text-gray-600">{message}</p>
    </div>
  );

  export default LoaderMessage;