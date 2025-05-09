import { useNavigate } from 'react-router-dom';
import { Card, Text, Group } from '@mantine/core';
import Tilt from 'react-parallax-tilt';

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4">
      <header className="text-center py-2">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
          About this Project
        </h1>
        <p className="text-gray-600">
          Advanced Physiological Signal Processing
        </p>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white p-12 rounded-lg shadow-lg">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl font-semibold">Revolutionizing Signal Processing</h2>
            <p className="mt-4 text-lg">
              Our platform offers advanced techniques for the processing of physiological signals, including resampling, filtering, and outlier detection, with state-of-the-art metrics to ensure accurate and reliable results.
            </p>
            <p className="mt-4 text-lg">
              The system allows users to apply various signal processing techniques through a user-friendly interface with interactive visualizations.
            </p>
            <button
              onClick={() => navigate('/')}
              className="mt-6 px-6 py-3 text-lg font-semibold text-indigo-600 bg-white rounded-lg shadow hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Try out
            </button>
          </div>

          <Tilt
            className="flex-1 overflow-hidden rounded-lg shadow-lg"
            glareEnable={true}
            glareMaxOpacity={0.5}
            glareColor="white"
            glarePosition="all"
            scale={1}
            transitionSpeed={400}
          >
            <img
              src="/processing.gif"
              alt="Signal Processing"
              className="w-full h-full"
            />
          </Tilt>
        </div>
      </section>

      {/* Funding Section */}
      <div className="shadow-lg rounded-lg my-12" id="logos">
        <p className="text-center p-4 text-lg text-gray-700">
          The research for this software was partially funded by the Junta de Castilla y León (project BU055P20), the Ministry of Science and Innovation of Spain (projects PID2020-119894GB-I00 and TED 2021-129485B-C43).
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
          <a href="https://ec.europa.eu/regional_policy/en/funding/erdf/" target="_blank" rel="noopener noreferrer">
            <img className="w-full" alt="FEDER" src="/FEDER.svg" />
          </a>
          <a href="http://www.mineco.gob.es/portal/site/mineco/" target="_blank" rel="noopener noreferrer">
            <img className="w-full" alt="MEC" src="/MEC.svg" />
          </a>
          <a href="https://www.jcyl.es/" target="_blank" rel="noopener noreferrer">
            <img className="w-full" alt="JCYL" src="/JCYL.svg" />
          </a>
          <a href="https://www.educa.jcyl.es/universidad/es/fondos-europeos/fondo-europeo-desarrollo-regional-feder/" target="_blank" rel="noopener noreferrer">
            <img className="w-full" alt="JCYL_impulsa" src="/JCYL_impulsa.svg" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default About;
