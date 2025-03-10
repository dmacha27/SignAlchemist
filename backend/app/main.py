from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import pandas as pd
import neurokit2 as nk
import numpy as np
from scipy.signal import cheby2, sosfiltfilt, resample
from scipy.interpolate import interp1d, UnivariateSpline
from scipy.ndimage import gaussian_filter1d
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
    data: str = Form(...),
    interpolation_technique: str = Form(...),
    source_sampling_rate: float = Form(...),
    target_sampling_rate: float = Form(...),
):


    data = np.array(json.loads(data))

    min_timestamp = min(data[:, 0])
    max_timestamp = max(data[:, 0])

    num = int(len(data[:, 1]) * (target_sampling_rate / source_sampling_rate))


    new_time = np.linspace(min_timestamp, max_timestamp, num)


    if interpolation_technique == "spline":
      interp_func = UnivariateSpline(data[:, 0], data[:, 1])
    else:
      interp_func = interp1d(data[:, 0], data[:, 1])
    

    new_values = interp_func(new_time)

    new_data = np.stack((new_time, new_values), axis=1)

    return JSONResponse(content={"data": new_data.tolist()})


@app.options("/filtering")
async def options_resampling():
    return {"message": "Preflight OPTIONS request handled"}

@app.post("/filtering")
async def resampling(
    signal: str = Form(...),
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
            status_code=400
        )
        else:
           new_values = nk.signal_filter(
              data[:, 1], sampling_rate=sampling_rate, method=method, 
              lowcut=lowcut, highcut=highcut, order=order
          )
          
        new_data = np.stack((data[:, 0], new_values), axis=1)

        return JSONResponse(content={"data": new_data.tolist()})

    except Exception as e:
        return JSONResponse(
            content={"error": str(e)},
            status_code=400
        )


@app.post("/process")
async def process(
    file: UploadFile = File(...), 
    signalType: str = Form(...), 
    timestampColumn: int = Form(...), 
    signalValues: int = Form(...)
):

    df = pd.read_csv(file.file)

    if signalValues >= len(df.columns):
        return JSONResponse(status_code=400, content={"error": f"La columna '{signalValues}' no existe en el archivo."})

    signal_data = df[df.columns[signalValues]]

    no_outliers = hampel_IQR_GSR(signal_data)
    filtering = gaussian1_gsr(no_outliers)


    df_outliers = df.copy()
    df_outliers[df.columns[signalValues]] = no_outliers

    df_filtering = df.copy()
    df_filtering[df.columns[signalValues]] = filtering

    pipelines = [
       {"title": "Pipeline 1", "signal": df_outliers.values.tolist(), "qualityMetric": gsr_quality(no_outliers)},
        {"title": "Pipeline 2", "signal": df_filtering.values.tolist(), "qualityMetric": gsr_quality(filtering)},

    ]
    
    return JSONResponse(content={"pipelines": pipelines})

def hampel_IQR_GSR(gsr):

    gsr_filtered = np.array(nk.rsp_clean(gsr, sampling_rate=4, method="hampel"))

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


def gaussian1_gsr(gsr):

    sigma = 400
    column_values_resampled = gaussian_filter1d(gsr, sigma=sigma)

    return column_values_resampled

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
        rac[ix] = (vmax-vmin)/(abs(vmin) + 1e-10) # Avoid zero division
      elif imin > imax:
        rac[ix] = (vmin-vmax)/(abs(vmax)  + 1e-10)

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
  for i in range(moving_window,0,-1):
    rolling_mean = np.append(rolling_mean,np.mean(quality["values"][-i:]))

  mean_score = np.mean(rolling_mean)

  return mean_score