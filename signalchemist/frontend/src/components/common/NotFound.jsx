import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center gap-5">
      <h1 className="text-5xl font-bold">404 - Page not found</h1>
      <p>Sorry, we couldn't find what you were looking for.</p>
      <button
        onClick={() => navigate("/")}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        HOME
      </button>
    </div>
  );
};

export default NotFound;
