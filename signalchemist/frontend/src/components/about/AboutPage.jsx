import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Tilt from "react-parallax-tilt";
import { FaArrowRight, FaBookOpen, FaProjectDiagram, FaWaveSquare } from "react-icons/fa";
import { FaChartColumn, FaDiagramProject } from "react-icons/fa6";
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
              <WorkspaceActionLink href="/docs/index.html">{t("about.readDocs")}</WorkspaceActionLink>
            </div>
          </div>
        }
      />

      <WorkspaceSection className="grid gap-6 lg:grid-cols-2">
        <WorkspaceCard
          title={t("about.toolkitTitle")}
          description={t("about.toolkitDescription")}
          icon={<FaWaveSquare />}
        >
          <div className="space-y-4">
            <div className="space-y-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
              <p>{t("about.p1")}</p>
              <p>{t("about.p2")}</p>
              <p>{t("about.p3")}</p>
              <p>{t("about.p4")}</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {[
                { icon: <FaDiagramProject />, title: t("about.cards.processingTitle"), text: t("about.cards.processingText") },
                { icon: <FaChartColumn />, title: t("about.cards.metricsTitle"), text: t("about.cards.metricsText") },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-[1.1rem] border border-slate-200 bg-slate-50/90 p-4 dark:border-gray-700 dark:bg-gray-950/70"
                >
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm text-white dark:bg-white dark:text-slate-900">
                      {item.icon}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {item.text}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </WorkspaceCard>

        <div className="space-y-6">
          <WorkspaceCard
            title={t("about.workflowTitle")}
            description={t("about.workflowDescription")}
            icon={<FaProjectDiagram />}
          >
            <Tilt
              className="overflow-hidden rounded-[0.9rem]"
              tiltReverse={true}
              tiltMaxAngleX={5}
              tiltMaxAngleY={5}
              perspective={600}
            >
              <img
                src="/processing.gif"
                alt={t("about.workflowImageAlt")}
                className="h-full w-full rounded-[0.9rem] object-cover shadow-[0_18px_45px_rgba(15,23,42,0.16)] dark:shadow-[0_20px_50px_rgba(2,6,23,0.45)]"
                style={{ pointerEvents: "none" }}
              />
            </Tilt>
          </WorkspaceCard>

          <WorkspaceCard
            title={t("about.fundingTitle")}
            description={t("about.fundingDescription")}
          >
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
              {t("about.fundingBody.beforeFirst")}
              <strong>TED2021-129485B-C4</strong>
              {t("about.fundingBody.afterFirst")}
              <em>"NextGenerationEU"</em>
              {t("about.fundingBody.betweenProjects")}
              <strong>PID2023-150694OA-I00</strong>
              {t("about.fundingBody.afterSecond")}
              <em>"ERDF/EU"</em>
              {t("about.fundingBody.end")}
            </p>
          </WorkspaceCard>
        </div>
      </WorkspaceSection>
    </WorkspacePage>
  );
};

export default AboutPage;
