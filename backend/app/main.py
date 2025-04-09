from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import pandas as pd
import neurokit2
import numpy as np
import scipy
from scipy.signal import cheby2, sosfiltfilt, resample
from scipy.ndimage import gaussian_filter1d

from app.metrics import *

# from scipy.signal import cheby2, sosfiltfilt, resample
# from scipy.interpolate import interp1d, UnivariateSpline
# from scipy.ndimage import gaussian_filter1d

import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.options("/resampling")
async def options_resampling():
    return {"message": "Preflight OPTIONS request handled"}


@app.post("/resampling")
async def resampling(
    signal: str = Form(...),
    interpolation_technique: str = Form(...),
    source_sampling_rate: float = Form(...),
    target_sampling_rate: float = Form(...),
):

    signal = np.array(json.loads(signal))

    min_timestamp = min(signal[:, 0])
    max_timestamp = max(signal[:, 0])

    num = int(len(signal[:, 1]) *
              (target_sampling_rate / source_sampling_rate))

    new_time = np.linspace(min_timestamp, max_timestamp, num)

    if interpolation_technique == "spline":
        interp_func = scipy.interpolate.UnivariateSpline(
            signal[:, 0], signal[:, 1])
    else:
        interp_func = scipy.interpolate.interp1d(signal[:, 0], signal[:, 1])

    new_values = interp_func(new_time)

    new_data = np.stack((new_time, new_values), axis=1)

    return JSONResponse(content={"data": new_data.tolist()})


@app.options("/outliers")
async def options_outliers():
    return {"message": "Preflight OPTIONS request handled"}


@app.post("/outliers")
async def outliers(
    signal: str = Form(...),
    outlier_technique: str = Form(...),
):
    signal = np.array(json.loads(signal))

    if outlier_technique == "hampel":
        new_values = hampel_IQR_GSR(signal[:, 1])

    elif outlier_technique == "iqr":
        new_values = IQR(signal[:, 1])

    new_data = np.stack((signal[:,0], new_values), axis=1)

    return JSONResponse(content={"data": new_data.tolist()})


@app.options("/filtering")
async def options_filtering():
    return {"message": "Preflight OPTIONS request handled"}


@app.post("/filtering")
async def filtering(
    signal: str = Form(...),
    signal_type: str = Form(...),
    sampling_rate: int = Form(...),
    method: str = Form(...),
    lowcut: float = Form(None),
    highcut: float = Form(None),
    order: int = Form(None),
    python: str = Form(None)
):
    try:
        order = 2 if not order else order
        python = "" if not python else python

        data = np.array(json.loads(signal))

        if python != "":
            try:
                namespace = globals().copy()
                exec(python, namespace)
                filter_signal = namespace["filter_signal"]

                new_values = filter_signal(data[:, 1])

            except Exception as e:
                return JSONResponse(
                    content={"error": str(e)},
                    status_code=400)
        else:
            new_values = neurokit2.signal_filter(
                data[:, 1], sampling_rate=sampling_rate, method=method,
                lowcut=lowcut, highcut=highcut, order=order
            )

        new_data = np.stack((data[:, 0], new_values), axis=1)

        return JSONResponse(content={"data": new_data.tolist(),
                                     "original_quality": get_metrics(data[:, 1], fs=sampling_rate, signal_type=signal_type),
                                     "filtered_quality": get_metrics(new_values, fs=sampling_rate, signal_type=signal_type)})

    except Exception as e:
        return JSONResponse(
            content={"error": str(e)},
            status_code=400
        )


def get_metrics(signal, fs, signal_type):

    if signal_type == "EDA":
        return {"Böttcher, S., Vieluf, S., Bruno, E., Joseph, B., Epitashvili, N., Biondi, A., ... & Loddenkemper, T. (2022). Data quality evaluation in wearable monitoring. Scientific reports, 12(1), 21412.": gsr_quality(signal, fs=fs),
                "Kleckner, I. R., Jones, R. M., Wilder-Smith, O., Wormwood, J. B., Akcakaya, M., Quigley, K. S., ... & Goodwin, M. S. (2017). Simple, transparent, and flexible automated quality assessment procedures for ambulatory electrodermal activity data. IEEE Transactions on Biomedical Engineering, 65(7), 1460-1467.": gsr_automated_2secs(signal, fs=fs)}


@app.post("/process")
async def process(
    signal: str = Form(...),
    signalType: str = Form(...)
):

    data = np.array(json.loads(signal))

    signal_data = data[:, 1]

    outliers_functions_names = ["IQR", "HAMPEL"]
    filter_functions_names = ["Butterworth", "Gaussian"]

    outliers_functions = [IQR, hampel_IQR_GSR]
    filter_functions = [butterworth_gsr_bvp, gaussian1_gsr]

    pipelines = []

    for i, outlier_func in enumerate(outliers_functions):
        signal_no_outliers = outlier_func(signal_data)

        for j, filter_func in enumerate(filter_functions):
            filtered_signal = filter_func(signal_no_outliers)

            data_processed = data.copy()
            data_processed[:, 1] = filtered_signal

            quality = gsr_quality(np.array(filtered_signal))

            pipelines.append({
                "title": f"Pipeline {outliers_functions_names[i]}-{filter_functions_names[j]}",
                "signal": data_processed.tolist(),
                "qualityMetric": quality
            })

    return JSONResponse(content={"pipelines": pipelines})


def IQR(signal):

    signal_array = np.array(signal, dtype=float)

    Q1 = np.percentile(signal_array, 25)
    Q3 = np.percentile(signal_array, 75)
    IQR = Q3 - Q1

    lower_bound = Q1 - 1.5 * IQR
    upper_bound = Q3 + 1.5 * IQR

    outliers = (signal_array < lower_bound) | (signal_array > upper_bound)

    clean_signal = signal_array.copy()
    clean_signal[outliers] = np.nan

    nans = np.isnan(clean_signal)
    if any(nans):
        clean_signal[nans] = np.interp(
            np.where(nans)[0],  # Índices de los NaN
            np.where(~nans)[0],  # Índices de los valores válidos
            clean_signal[~nans]   # Valores válidos
        )

    clean_signal[np.isnan(clean_signal)] = np.nanmean(clean_signal)

    return clean_signal.tolist()


def hampel_IQR_GSR(gsr):

    gsr_filtered = np.array(neurokit2.rsp_clean(
        gsr, sampling_rate=4, method="hampel"))

    Q1 = np.percentile(gsr_filtered, 25)
    Q3 = np.percentile(gsr_filtered, 75)
    IQR = Q3 - Q1

    lower_bound = Q1 - 1.5 * IQR
    upper_bound = Q3 + 1.5 * IQR

    outliers = (gsr_filtered < lower_bound) | (gsr_filtered > upper_bound)

    gsr_cleaned = gsr_filtered.copy()
    gsr_cleaned[outliers] = np.nan

    gsr_clean_series = pd.Series(gsr_cleaned).interpolate(method="linear")
    gsr_clean_series = gsr_clean_series.fillna(gsr_clean_series.mean())

    return gsr_clean_series.to_numpy()


def butterworth_gsr_bvp(signal, sampling_rate=64):
    signal_filtered = nk.signal.signal_filter(
        signal,
        sampling_rate=sampling_rate,
        highcut=1
    )

    return list(signal_filtered)


def gaussian1_gsr(signal):
    new_values = scipy.ndimage.gaussian_filter1d(signal, sigma=300)
    return new_values


def gsr_quality(eda, fs=4):
    """Python implementation of Matlab code in Github.

    Böttcher, S., Vieluf, S., Bruno, E., Joseph, B.,
    Epitashvili, N., Biondi, A., ... & Loddenkemper, T. (2022).
    Data quality evaluation in wearable monitoring. Scientific reports, 12(1), 21412."""

    quality = {}

    quality["metric1"] = eda
    quality["values1"] = eda >= 0.05

    def getRAC(signal, T=2):
        intervals = range(0, len(signal), T*fs)
        rac = np.full(len(signal), np.nan)

        for ix in intervals:
            if (ix + T*fs - 1) >= len(signal):
                continue

            windowdata = signal[ix:ix+T*fs]
            imin = np.argmin(windowdata)
            vmin = windowdata[imin]

            imax = np.argmax(windowdata)
            vmax = windowdata[imax]

            if imin < imax:
                # Avoid zero division
                rac[ix] = (vmax-vmin)/(abs(vmin) + 1e-10)
            elif imin > imax:
                rac[ix] = (vmin-vmax)/(abs(vmax) + 1e-10)

        last = np.nan

        # Fill missing with previous
        for i in range(len(rac)):
            if not np.isnan(rac[i]):
                last = rac[i]
            else:
                rac[i] = last

        return rac

    quality["metric2"] = getRAC(eda)
    quality["values2"] = abs(quality["metric2"]) < 0.2

    quality["values"] = quality["values1"] & quality["values2"]

    # Moving/Rolling mean
    moving_window = 60*fs

    w_real = moving_window+1
    cumsum = np.cumsum(np.insert(quality["values"], 0, 0))
    rolling_mean = (cumsum[w_real:] - cumsum[:-w_real]) / float(w_real)
    for i in range(moving_window, 0, -1):
        rolling_mean = np.append(rolling_mean, np.mean(quality["values"][-i:]))

    mean_score = np.mean(rolling_mean)

    return mean_score
