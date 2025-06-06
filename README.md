
<p align="center" style="background-color: white; padding: 10px; border-radius: 15px;">
  <img src="SignAlchemist.png" alt="SignAlchemist" width="350" />
</p>

# ⚗️ SignAlchemist

SignAlchemist is an open-source web application designed to make physiological signal processing easy; nonetheless, any other signal can be processed.
Its main aim is to be accessible to practitioners and researchers everywhere, providing a simple graphical user interface based on nodes for novice users, and more complex functionality for people with Python programming knowledge.
The application has been designed with up-to-date web-based frameworks that make it responsive and easy to use on any device.

## ✨ Features (more to come!)

* **Resampling:** changes the sampling rate of the signal by using several interpolation techniques such as *spline* or *interp1d*. This is useful when signals come from different sources or when they need to be normalized to a common frequency.
* **Filtering:** removes artefacts (*e.g.*, noise, high-frequency...) using different filters including *Butterworth*, *Bessel*, *FIR*, and *Savitzky-Golay*. Parameters such as cutoff frequencies can be set based on user needs. Furthermore, users can create and customize their own filters using Python by following the instructions on the page.
* **Outlier detection:** identifies and removes unusual data that deviate significantly from the expected signal pattern. Techniques available include the *Hampel* filter and IQR-based detection, aiming to improve signal quality without affecting legitimate variations.

---

## 🛠️ Installation

### 🐳 Docker Setup

SignAlchemist uses Docker containers to simplify the installation process.

#### ⚙️ Environment Variables

Edit the environment variables file with:

```bash
nano .env
```

Example configuration:

```bash
VITE_BACKEND_PORT=   # Port where the backend server will run
FRONTEND_PORT=       # Port where the frontend will be accessible
PYTHON_ENABLED=      # Enable Python scripting support (true/false)
```

This application is managed through three different files: `.env`, `.env.dev`, and `.env.prod`.

* **`.env`**: Used only when neither `.env.dev` nor `.env.prod` are present in the build command.
* **`.env.dev`**: Used for the development build.
* **`.env.prod`**: Used for the production build (Python scripting disabled).

#### 🚧 Development Mode

To start the application in development mode, run:

```bash
docker compose -f docker-compose.dev.yml --env-file .env.dev up --build
```

* The flag `--env-file .env.dev` specifies the environment variables file for development. **Important!**

#### 🚀 Production Mode

To run the application in production mode, use:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up --build -d
```

* The flag `--env-file .env.prod` specifies the environment variables file for production. **Important!**

---

## 🚪 Usage

After launching the containers, open your web browser and navigate to:

```
http://localhost:<FRONTEND_PORT>
```

Replace `<FRONTEND_PORT>` with the port number you set in your `.env` file.

---

## 📄 License

This project is licensed under the GNU General Public License v3.0 (GPL-3.0).

---
