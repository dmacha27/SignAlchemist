import { useNavigate } from "react-router-dom";
import Tilt from "react-parallax-tilt";
import { useContext } from "react";

import { ThemeContext } from "../contexts/ThemeContext";

const About = () => {
  const navigate = useNavigate();

  // Detect dark mode
  const { isDarkMode: isDark } = useContext(ThemeContext);

  return (
    <div className="max-w-7xl mx-auto px-4">
      <header className="text-center py-6">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
          About this Project
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Advanced Physiological Signal Processing
        </p>
      </header>

      <section className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white p-10 rounded-lg shadow">
        <div className="grid md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-8 text-left">
            <h1 className="text-lg font-semibold mb-2">
              Signal Processing Toolkit
            </h1>
            <p>
              This open-source web application was designed to simplify signal
              processing, particularly for physiological data such as EDA and
              PPG. However, it is flexible enough to work with any time-series
              signal{" "}
            </p>
            <p className="mt-2">
              It offers an intuitive, modular interface where you can resample,
              filter, and build custom processing pipelines without writing code
              (unless you want to). Each step is fully visualized, so you can
              see how your data changes as you go. Advanced users can even
              insert custom Python scripts using libraries such as SciPy or
              NeuroKit2.
            </p>
            <p className="mt-2">
              The <strong>Processing</strong> page features a visual workflow
              tool where you can connect blocks for filtering, outlier
              detection, and resampling, with more options to come! It's a very
              user-friendly and flexible space for building and experimenting
              with signal processing pipelines.{" "}
            </p>
            <p className="mt-2">
              For physiological signals, the app also provides automatic quality
              metrics, helping you evaluate both raw and processed data.
            </p>
            <p className="mt-2">
              This tool is constantly evolving. New features, nodes, and metrics
              will continue to be added based on user needs and the latest
              research.
            </p>

            <button
              onClick={() => navigate("/")}
              className="mt-4 p-3 bg-white text-indigo-600 dark:bg-gray-800 dark:text-gray-100 text-lg rounded about-button"
            >
              Try it out
            </button>
          </div>

          <div className="md:col-span-4">
            <Tilt
              className="rounded-lg overflow-hidden shadow-lg"
              tiltReverse={true}
              tiltMaxAngleX={5}
              tiltMaxAngleY={5}
              perspective={600}
            >
              <img
                src={isDark ? "/processing_dark.gif" : "/processing.gif"}
                alt="Signal Processing"
                className="w-full h-full object-cover"
                style={{ pointerEvents: "none" }} // Prevent image from being dragged
              />
            </Tilt>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
