from fastapi import FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import pandas as pd
import neurokit2
import numpy as np
import scipy

from app.hr import compute_emotibit_heart_rate, compute_neurokit_heart_rate
from app.metrics import (
    bottcher_quality,
    kleckner_quality,
    kleckner_quality_filter,
    maki_quality,
)
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

MAX_SAMPLES_ALLOWED = 150_000  # Maximum samples allowed for processing in production


def check_max_samples(length: int, operation: str):
    python_enabled = os.getenv("PYTHON_ENABLED") == "true"
    if not python_enabled and length > MAX_SAMPLES_ALLOWED:
        return JSONResponse(
            content={
                "error": f"{operation} request too large for production server."},
            status_code=400
        )
    return None


def validate_sampling_rate(sampling_rate: float, operation: str):
    if not np.isfinite(sampling_rate) or sampling_rate <= 0:
        return JSONResponse(
            content={
                "error": f"{operation} requires a valid sampling rate greater than 0."
            },
            status_code=400,
        )
    return None


def sanitize_filter_config(config: dict) -> dict:
    return {
        key: value
        for key, value in config.items()
        if key != "python" and value is not None
    }


def apply_builtin_filter(values, sampling_rate: float, config: dict):
    method = config.get("method")

    if method == "gaussian":
        sigma = config.get("sigma", 100)
        return scipy.ndimage.gaussian_filter1d(values, sigma=sigma)

    return neurokit2.signal_filter(
        values,
        sampling_rate=sampling_rate,
        **config
    )


def apply_normalization(values, method: str):
    if method == "zscore":
        mean = np.mean(values)
        std = np.std(values)
        if std == 0:
            return np.zeros_like(values, dtype=np.float64)
        return (values - mean) / std

    if method == "minmax":
        min_value = np.min(values)
        max_value = np.max(values)
        value_range = max_value - min_value
        if value_range == 0:
            return np.zeros_like(values, dtype=np.float64)
        return (values - min_value) / value_range

    raise ValueError("Invalid normalization method")


def build_peak_payload(data, peak_indices):
    return [
        {
            "index": int(index),
            "timestamp": float(data[index, 0]),
            "value": float(data[index, 1]),
            "height": float(data[index, 1]),
        }
        for index in peak_indices
    ]


def build_series_payload(data):
    return [[float(row[0]), float(row[1])] for row in data]


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

    error = check_max_samples(num_samples, "Resampling")
    if error:
        return error

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

    error = check_max_samples(len(values), "Outlier detection")
    if error:
        return error

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
    sampling_rate: float = Form(...,
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

        sampling_rate_error = validate_sampling_rate(sampling_rate, "Filtering")
        if sampling_rate_error:
            return sampling_rate_error

        error = check_max_samples(len(data), "Filtering")
        if error:
            return error

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
            sanitized_config = sanitize_filter_config(config)
            new_values = apply_builtin_filter(
                data[:, 1],
                sampling_rate=sampling_rate,
                config=sanitized_config
            )

        new_data = np.stack((data[:, 0], new_values), axis=1)
        return JSONResponse(content={"data": new_data.tolist()})
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=400)


@app.options("/normalization", include_in_schema=False)
async def options_normalization():
    return {"message": "Preflight OPTIONS request handled"}


@app.post("/normalization", summary="Normalize a signal", tags=["Preprocessing"])
async def normalization(
    signal: str = Form(...,
                       description="JSON-encoded list of `[timestamp, value]` pairs."),
    normalization_method: str = Form(
        ..., description="Normalization method: `'zscore'` or `'minmax'`."),
):
    """
    Normalize a signal using a standard scaling strategy.
    """
    try:
        data = np.array(json.loads(signal), dtype=np.float64)
        values = data[:, 1]

        error = check_max_samples(len(values), "Normalization")
        if error:
            return error

        normalized_values = apply_normalization(values, normalization_method)
        new_data = np.stack((data[:, 0], normalized_values), axis=1)
        return JSONResponse(content={"data": new_data.tolist()})
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=400)


@app.options("/peaks", include_in_schema=False)
async def options_peaks():
    return {"message": "Preflight OPTIONS request handled"}


@app.post("/peaks", summary="Detect peaks in a signal", tags=["Analysis"])
async def peaks(
    signal: str = Form(...,
                       description="JSON-encoded list of `[timestamp, value]` pairs."),
    sampling_rate: float = Form(..., description="Sampling rate of the input signal in Hz."),
    detector: str = Form(
        "scipy", description="Peak detector backend: `'scipy'` or `'neurokit'`."),
    signal_type: str = Form(
        "OTHER", description="Signal type used to select NeuroKit-specific detection logic."),
    min_distance_seconds: float = Form(
        0.0, description="Minimum distance between peaks, in seconds."),
    height: float | None = Form(
        None, description="Minimum height required for a peak."),
):
    """
    Detect peaks in a signal using SciPy peak detection.
    """
    try:
        data = np.array(json.loads(signal), dtype=np.float64)
        values = data[:, 1]

        sampling_rate_error = validate_sampling_rate(sampling_rate, "Peak detection")
        if sampling_rate_error:
            return sampling_rate_error

        error = check_max_samples(len(values), "Peak detection")
        if error:
            return error

        detector = detector.lower()
        signal_type = signal_type.upper()

        if detector == "neurokit":
            if signal_type == "PPG":
                cleaned = neurokit2.ppg_clean(values, sampling_rate=sampling_rate)
                info = neurokit2.ppg_findpeaks(cleaned, sampling_rate=sampling_rate)
                peak_indices = np.asarray(info["PPG_Peaks"], dtype=int)
                peaks_data = build_peak_payload(data, peak_indices)
            elif signal_type == "EDA":
                cleaned = neurokit2.eda_clean(values, sampling_rate=sampling_rate)
                phasic = neurokit2.eda_phasic(cleaned, sampling_rate=sampling_rate)
                phasic_values = np.asarray(phasic["EDA_Phasic"].values, dtype=np.float64)
                info = neurokit2.eda_findpeaks(
                    phasic_values,
                    sampling_rate=sampling_rate,
                    method="neurokit",
                )
                peak_indices = np.asarray(info["SCR_Peaks"], dtype=int)
                peaks_data = build_peak_payload(data, peak_indices)
            else:
                info = neurokit2.signal_findpeaks(values, relative_height_min=0)
                peak_indices = np.asarray(info["Peaks"], dtype=int)
                peaks_data = build_peak_payload(data, peak_indices)
        elif detector == "scipy":
            min_distance_samples = max(
                1,
                int(round(max(min_distance_seconds, 0) * sampling_rate))
            )

            peak_indices, properties = scipy.signal.find_peaks(
                values,
                distance=min_distance_samples,
                height=height,
            )
            peaks_data = build_peak_payload(data, peak_indices)
        else:
            return JSONResponse(content={"error": "Invalid peak detector"}, status_code=400)

        return JSONResponse(content={"peaks": peaks_data})
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=400)


@app.options("/hr", include_in_schema=False)
async def options_hr():
    return {"message": "Preflight OPTIONS request handled"}


@app.post("/hr", summary="Estimate heart rate from a PPG signal", tags=["Analysis"])
async def heart_rate(
    signal: str = Form(...,
                       description="JSON-encoded list of `[timestamp, value]` pairs."),
    sampling_rate: float = Form(..., description="Sampling rate of the input signal in Hz."),
    signal_type: str = Form(
        ..., description="Signal type. Heart rate analysis is only supported for `'PPG'`."),
    method: str = Form(
        "emotibit", description="Heart rate backend: `'emotibit'` or `'neurokit'`."),
):
    try:
        data = np.array(json.loads(signal), dtype=np.float64)

        sampling_rate_error = validate_sampling_rate(sampling_rate, "Heart rate")
        if sampling_rate_error:
            return sampling_rate_error

        error = check_max_samples(len(data), "Heart rate")
        if error:
            return error

        if signal_type.upper() != "PPG":
            return JSONResponse(
                content={"error": "Heart rate analysis is only available for PPG signals."},
                status_code=400
            )

        method = method.lower()
        if method == "emotibit":
            heart_rate_data = compute_emotibit_heart_rate(data, sampling_rate)
        elif method == "neurokit":
            heart_rate_data = compute_neurokit_heart_rate(data, sampling_rate)
        else:
            return JSONResponse(
                content={"error": "Invalid heart rate method"},
                status_code=400
            )

        return JSONResponse(content={
            "data": build_series_payload(heart_rate_data),
            "beat_count": int(len(heart_rate_data)),
        })
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
    sampling_rate: float = Form(..., description="Sampling rate in Hz."),
):
    """
    Compute quality metrics for EDA or PPG signals based on literature.

    Returns a dictionary with multiple metric values and their descriptions.
    """
    try:
        data = np.array(json.loads(signal))
        values = data[:, 1]

        sampling_rate_error = validate_sampling_rate(sampling_rate, "Metrics")
        if sampling_rate_error:
            return sampling_rate_error

        error = check_max_samples(len(values), "Metrics")
        if error:
            return error

    except Exception as e:
        return {"error": f"Invalid signal format: {e}"}

    signal_type = signal_type.upper()

    if signal_type == "EDA":
        return {
            "Böttcher et al. (2022)": {
                "value": bottcher_quality(values, fs=sampling_rate),
                "description": "EDA quality score based on amplitude plausibility and RAC stability. Higher is better.",
            },
            "Kleckner et al. (2017) Raw": {
                "value": kleckner_quality(values, fs=sampling_rate),
                "description": "Automated EDA quality score using range, slope and artifact spreading rules on the raw signal. Higher is better.",
            },
            "Kleckner et al. (2017) 2s Filter": {
                "value": kleckner_quality_filter(values, fs=sampling_rate),
                "description": "Automated EDA quality score using the same range, slope and artifact spreading rules after a 2-second pre-filter. Higher is better.",
            },
        }
    elif signal_type == "PPG":
        return {
            "Maki et al. (2020)": {
                "value": maki_quality(values, fs=sampling_rate),
                "description": "Q_PHV pulse-height variability metric based on beat-to-beat pulse height variation. Lower is better.",
            }
        }
    else:
        return {"error": "Signal type not supported"}
