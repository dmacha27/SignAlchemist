import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Tilt from "react-parallax-tilt";
import { FaArrowRight, FaBookOpen, FaProjectDiagram, FaWaveSquare } from "react-icons/fa";
import {
  WorkspaceActionLink,
  WorkspaceCard,
  WorkspaceHero,
  WorkspaceInnerCard,
  WorkspacePage,
  WorkspaceSection,
} from "../workspace/WorkspaceShell";

const AboutPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <WorkspacePage>
      <WorkspaceHero
        icon={<FaBookOpen />}
        title={t("about.title")}
        description={t("about.description")}
        badge={t("about.badge")}
        action={
          <div className="space-y-3">
            <p className="text-sm leading-5 text-slate-600 dark:text-slate-300">
              {t("about.intro")}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate("/")}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-200 dark:hover:bg-gray-800"
              >
                {t("about.tryNow")}
                <FaArrowRight size={12} />
              </button>
              <WorkspaceActionLink to="/docs">{t("about.readDocs")}</WorkspaceActionLink>
            </div>
          </div>
        }
      />

      <WorkspaceSection className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
        <WorkspaceCard
          title={t("about.toolkitTitle")}
          description={t("about.toolkitDescription")}
          icon={<FaWaveSquare />}
        >
          <div className="space-y-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
            <p>{t("about.p1")}</p>
            <p>{t("about.p2")}</p>
            <p>{t("about.p3")}</p>
            <p>{t("about.p4")}</p>
          </div>
        </WorkspaceCard>

        <div className="space-y-6">
          <WorkspaceCard
            title={t("about.workflowTitle")}
            description={t("about.workflowDescription")}
            icon={<FaProjectDiagram />}
          >
            <WorkspaceInnerCard className="p-2">
              <Tilt
                className="overflow-hidden rounded-[0.9rem] shadow-lg"
                tiltReverse={true}
                tiltMaxAngleX={5}
                tiltMaxAngleY={5}
                perspective={600}
              >
                <img
                  src="/processing.gif"
                  alt={t("about.workflowImageAlt")}
                  className="h-full w-full object-cover"
                  style={{ pointerEvents: "none" }}
                />
              </Tilt>
            </WorkspaceInnerCard>
          </WorkspaceCard>

          <WorkspaceCard
            title={t("about.fundingTitle")}
            description={t("about.fundingDescription")}
          >
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
              This work is part of the project <strong>TED2021-129485B-C4</strong>{" "}
              funded by MCIN/AEI/10.13039/501100011033 and the European Union{" "}
              <em>"NextGenerationEU"</em>/PRTR and project{" "}
              <strong>PID2023-150694OA-I00</strong> MICIU/AEI/10.13039/501100011033
              and by <em>"ERDF/EU"</em>.
            </p>
          </WorkspaceCard>
        </div>
      </WorkspaceSection>
    </WorkspacePage>
  );
};

export default AboutPage;
