import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const NotFound = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center gap-5">
      <h1 className="text-5xl font-bold">{t("notFound.title")}</h1>
      <p>{t("notFound.description")}</p>
      <button
        onClick={() => navigate("/")}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {t("notFound.home")}
      </button>
    </div>
  );
};

export default NotFound;
