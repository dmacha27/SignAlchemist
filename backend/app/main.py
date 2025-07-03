from fastapi import FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import pandas as pd
import neurokit2
import numpy as np
import scipy

from app.metrics import *
from app.outliers import *

import json
import os

app = FastAPI(
    title="SignAlchemist",
    description="""
### 🧪 SignAlchemist API

The SignAlchemist API provides tools for **preprocessing** and **quality assessment** of physiological signals, including EDA (Electrodermal Activity) and PPG/BVP (Photoplethysmography). Can be used for other signals too.

---
""",
    version="1.0.0",
    root_path="/api"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["System"])
def read_root():
    return {"message": "Welcome to the SignAlchemist API"}


@app.options("/resampling", include_in_schema=False)
async def options_resampling():
    return {"message": "Preflight OPTIONS request handled"}


@app.post("/resampling", summary="Resample a signal", tags=["Preprocessing"])
async def resampling(
    signal: str = Form(...,
                       description="JSON-encoded list of `[timestamp, value]` pairs representing the input signal."),
    interpolation_technique: str = Form(
        ..., description="Interpolation method to use: `'1d'` or `'spline'`."),
    target_sampling_rate: float = Form(...,
                                       description="Desired target sampling rate, in Hz."),
):
    """
    Resample a signal with state-of-art interpolation techniques.
    """

    signal = np.array(json.loads(signal), dtype=np.float64)

    min_timestamp = signal[:, 0].min()
    max_timestamp = signal[:, 0].max()

    duration = max_timestamp - min_timestamp
    num_samples = int(np.floor(duration * target_sampling_rate)) + 1

    new_time = min_timestamp + \
        np.arange(num_samples, dtype=np.float64) / target_sampling_rate

    if interpolation_technique == "spline":
        interp_func = scipy.interpolate.UnivariateSpline(
            signal[:, 0], signal[:, 1], s=1.0)
    else:
        interp_func = scipy.interpolate.interp1d(
            signal[:, 0], signal[:, 1], kind='linear')

    new_values = interp_func(new_time)
    new_data = np.stack((new_time, new_values), axis=1)

    return JSONResponse(content={"data": new_data.tolist()})


@app.options("/outliers", include_in_schema=False)
async def options_outliers():
    return {"message": "Preflight OPTIONS request handled"}


@app.post("/outliers", summary="Remove outliers from signal", tags=["Preprocessing"])
async def outliers(
    signal: str = Form(...,
                       description="JSON-encoded list of `[timestamp, value]` pairs."),
    outlier_technique: str = Form(
        ..., description="Outlier detection method: `'hampel'` or `'iqr'`."),
):
    """
    Remove statistical outliers from a signal using the selected method.
    """
    signal = np.array(json.loads(signal))
    values = signal[:, 1]

    if outlier_technique == "hampel":
        new_values = hampel(values)
    elif outlier_technique == "iqr":
        new_values = IQR(values)
    else:
        return JSONResponse(content={"error": "Invalid technique"}, status_code=400)

    new_data = np.stack((signal[:, 0], new_values), axis=1)
    return JSONResponse(content={"data": new_data.tolist()})


@app.options("/filtering", include_in_schema=False)
async def options_filtering():
    return {"message": "Preflight OPTIONS request handled"}


@app.post("/filtering", summary="Apply filter to signal", tags=["Preprocessing"])
async def filtering(
    signal: str = Form(...,
                       description="JSON-encoded list of `[timestamp, value]` pairs."),
    sampling_rate: int = Form(...,
                              description="Sampling rate of the input signal in Hz."),
    filter_config: str = Form(
        ..., description="JSON-encoded dict including `method`, `lowcut`, `highcut`, `order`, or `python`."),
):
    """
    Filter a signal using a predefined or custom method.

    Supports NeuroKit2 filters or custom inline Python code for full control.
    """

    try:
        config = json.loads(filter_config)
        data = np.array(json.loads(signal))
        python_enabled = os.getenv("PYTHON_ENABLED") == "true"

        if "python" in config and config["python"]:
            if not python_enabled:
                return JSONResponse(content={"error": "Python code is disabled in public build"}, status_code=403)
            try:
                namespace = globals().copy()
                exec(config["python"], namespace)
                filter_signal = namespace["filter_signal"]
                new_values = filter_signal(data[:, 1])
            except Exception as e:
                return JSONResponse(content={"error": str(e)}, status_code=400)
        else:
            del config["python"]
            new_values = neurokit2.signal_filter(
                data[:, 1],
                sampling_rate=sampling_rate,
                **config
            )

        new_data = np.stack((data[:, 0], new_values), axis=1)
        return JSONResponse(content={"data": new_data.tolist()})
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=400)


@app.options("/metrics", include_in_schema=False)
async def options_metrics():
    return {"message": "Preflight OPTIONS request handled"}


@app.post("/metrics", summary="Extract signal quality metrics", tags=["Metrics"])
def get_metrics(
    signal: str = Form(...,
                       description="JSON-encoded list of `[timestamp, value]` pairs."),
    signal_type: str = Form(...,
                            description="Signal type: `'EDA'` or `'PPG'`."),
    sampling_rate: int = Form(..., description="Sampling rate in Hz."),
):
    """
    Compute quality metrics for EDA or PPG signals based on literature.

    Returns a dictionary with multiple metric values and their descriptions.
    """
    try:
        data = np.array(json.loads(signal))
        values = data[:, 1]
    except Exception as e:
        return {"error": f"Invalid signal format: {e}"}

    if signal_type == "EDA":
        return {
            "Böttcher et al. (2022)": {
                "value": gsr_quality(values, fs=sampling_rate),
                "description": "Evaluates EDA signal quality using amplitude thresholding and RAC (range of absolute change) stability over 2-second windows, as per Böttcher et al. (2022).",
            },
            "Kleckner et al. (2017)": {
                "value": gsr_automated_2secs(values, fs=sampling_rate),
                "description": "Assesses EDA signal quality using automated heuristics described by Kleckner et al. (2017), typically over short 2-second windows.",
            },
        }
    elif signal_type == "PPG":
        return {
            "Mohamed Elgendi (2016)": {
                "value": bvp_skewness(values, fs=sampling_rate, W=2),
                "description": "Skewness is a measure of the symmetry (or the lack of it) of a probability distribution.",
            },
            "Maki et al. (2020)": {
                "value": bvp_quality(values, fs=sampling_rate),
                "description": "Quantifies the consistency of peak amplitudes in a BVP/PPG signal, with lower PHV values indicating higher signal reliability.",
            }
        }
    else:
        return {"error": "Signal type not supported"}
