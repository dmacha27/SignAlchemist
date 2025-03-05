from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import pandas as pd
import neurokit2 as nk
import numpy as np
from scipy.signal import cheby2, sosfiltfilt, resample
from scipy.ndimage import gaussian_filter1d

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*']
)

@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.options("/upload")
async def options_upload():
    return {"message": "Preflight OPTIONS request handled"}

@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...),  # Para manejar el archivo
    signalType: str = Form(...),   # Para manejar signalType
    timestampColumn: str = Form(...),  # Para manejar timestampColumn
    signalValues: str = Form(...)   # Para manejar signalValues
):
    # Aquí puedes procesar los datos como desees
    return JSONResponse(content={
        "filename": file.filename,
        "signalType": signalType,
        "timestampColumn": timestampColumn,
        "signalValues": signalValues
    })


@app.post("/process")
async def process(
    file: UploadFile = File(...), 
    signalType: int = Form(...), 
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