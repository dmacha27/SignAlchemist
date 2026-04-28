import { useNavigate } from "react-router-dom";
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

  return (
    <WorkspacePage>
      <WorkspaceHero
        icon={<FaBookOpen />}
        title="About this Project"
        description="SignAlchemist is a visual toolkit for exploring, transforming, and validating physiological signals without losing sight of the raw data."
        badge="Project overview"
        action={
          <div className="space-y-3">
            <p className="text-sm leading-5 text-slate-600 dark:text-slate-300">
              Explore the workflow, jump back into the Home workspace, or head
              straight into the docs.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate("/")}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-200 dark:hover:bg-gray-800"
              >
                Try it now
                <FaArrowRight size={12} />
              </button>
              <WorkspaceActionLink to="/docs">Read the docs</WorkspaceActionLink>
            </div>
          </div>
        }
      />

      <WorkspaceSection className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
        <WorkspaceCard
          title="Signal Processing Toolkit"
          description="A friendlier environment for preprocessing, comparing, and building custom pipelines around time-series data."
          icon={<FaWaveSquare />}
        >
          <div className="space-y-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
            <p>
              This open-source application was designed to simplify signal
              processing, especially for physiological data such as EDA and
              PPG, while remaining flexible enough for any time-series signal.
            </p>
            <p>
              You can resample, filter, and build custom pipelines visually,
              compare each result against the source signal, and even inject
              Python-based logic for more advanced workflows.
            </p>
            <p>
              The <strong>Processing</strong> page focuses on modular
              experimentation with reusable blocks for filtering, outlier
              detection, and resampling, and the platform keeps growing with
              new operations and metrics.
            </p>
            <p>
              For physiological signals, SignAlchemist also provides quality
              metrics to help you assess both the raw and transformed output.
            </p>
          </div>
        </WorkspaceCard>

        <div className="space-y-6">
          <WorkspaceCard
            title="Visual Workflow"
            description="A quick preview of the interactive processing experience."
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
                  alt="Signal Processing"
                  className="h-full w-full object-cover"
                  style={{ pointerEvents: "none" }}
                />
              </Tilt>
            </WorkspaceInnerCard>
          </WorkspaceCard>

          <WorkspaceCard
            title="Funding"
            description="Research projects supporting the development of SignAlchemist."
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
