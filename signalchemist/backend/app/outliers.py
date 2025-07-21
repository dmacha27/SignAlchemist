import numpy as np
import pandas as pd
import neurokit2

def IQR(signal):
    """Remove outliers using Interquartile Range (IQR) and interpolate missing values."""
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
            np.nonzero(nans)[0],  # Índices de los NaN
            np.nonzero(~nans)[0],  # Índices de los valores válidos
            clean_signal[~nans],  # Valores válidos
        )

    clean_signal[np.isnan(clean_signal)] = np.nanmean(clean_signal)

    return clean_signal.tolist()


def hampel(gsr):
    """Remove outliers from GSR signal using Hampel method and IQR logic."""
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