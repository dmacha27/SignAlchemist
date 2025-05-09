import { useNavigate } from 'react-router-dom';
import Tilt from 'react-parallax-tilt';

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4">
      <header className="text-center py-6">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
          About this Project
        </h1>
        <p className="text-gray-600">
          Advanced Physiological Signal Processing
        </p>
      </header>

      <section className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white p-10 rounded-lg shadow">
        <div className="grid md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-8 text-left">
            <h1 className="text-lg font-semibold mb-2">Signal Processing Toolkit</h1>
            <p>
              This application, developed by researchers, offers a set of advanced tools for processing physiological signals such as PPG, EDA, and other time-series data. It includes modules for resampling, filtering, and outlier detection, which can be combined in flexible workflows.
            </p>
            <p className="mt-2">
              Users can build custom processing pipelines by selecting and connecting different operations through a straightforward, visual interface. The system offers real-time updates, allowing you to monitor the results as you apply each step.
            </p>
            <p className="mt-2">
              All processing techniques are based on the latest research, ensuring state-of-the-art methods for signal handling. The platform also provides comprehensive metrics to evaluate the quality and reliability of your data at each step.
            </p>
            <p className="mt-2">
              Whether you're working with simple or complex signals, this toolkit gives you the flexibility and precision needed for reliable data processing, with a focus on usability and reproducibility.
            </p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 p-3 bg-white text-indigo-600 rounded"
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
                src="/processing.gif"
                alt="Signal Processing"
                className="w-full h-full object-cover"
                style={{ pointerEvents: 'none' }} // Prevent image from being dragged
              />
            </Tilt>
          </div>
        </div>
      </section>

      <section className=" rounded-lg shadow p-6 bg-white" id="logos">
        <p className="text-center text-gray-700 mb-6">
          This software is part of the R&D project PID2023-150694OA-I00, funded by the Agencia Estatal de Investigación (AEI), under the Ministerio de Ciencia, Innovación y Universidades (MICIU), co-financed by the Fondo Europeo de Desarrollo Regional (FEDER) under the program “Una manera de hacer Europa”, and by the “Unión Europea NextGenerationEU/PRTR” funds</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <a href="https://ec.europa.eu/regional_policy/en/funding/erdf/" target="_blank" rel="noopener noreferrer">
            <img src="/FEDER.svg" alt="FEDER" className="w-full" />
          </a>
        </div>
      </section>
    </div>
  );
};

export default About;
