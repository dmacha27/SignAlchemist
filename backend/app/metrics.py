import numpy as np
import neurokit2 as nk
from scipy.stats import skew
from scipy.signal import find_peaks, filtfilt


def bvp_skewness(signal, fs=None):
    """
    Elgendi, M. (2016). Optimal signal quality index for photoplethysmogram signals. Bioengineering, 3(4), 21
    """

    return np.abs(skew(signal))


def bvp_skewness(signal, fs=64, W=2):
    """
    Elgendi, M. (2016). Optimal signal quality index for photoplethysmogram signals. Bioengineering, 3(4), 21
    """

    skewness = []
    window_size = fs * W

    for i in range(len(signal) - window_size + 1):
        skewness.append(np.abs(skew(signal[i : i + window_size])))
    return np.mean(skewness)


def bvp_quality(data, fs=64, MinPeakDistance=None, MinPeakHeight=0):
    # Originalmente: MinPeakDistance = 60 / 240
    print(f"\n\t\tMetric: bvp_quality")
    print(f"\t\tFreq: {fs}")

    # MinPeakDistance debe ser al menos 1 y entero
    if MinPeakDistance is None:
        MinPeakDistance = max(1, round(fs / 240))

    def normalize_mean_peak_height(data, MinPeakDistance, MinPeakHeight):
        data = data - np.mean(data)
        pks, _ = find_peaks(data, distance=MinPeakDistance, height=MinPeakHeight)
        dataout = data / np.mean(data[pks])
        return dataout

    signal = normalize_mean_peak_height(data, MinPeakDistance, MinPeakHeight)
    pks, _ = find_peaks(signal, distance=MinPeakDistance, height=MinPeakHeight)
    Q_PHV = np.var(signal[pks])
    return Q_PHV


def bvp_neurokit(bvp, fs=1000):
    print(f"\n\t\tMetric: bvp_neurokit")
    print(f"\t\tFreq: {fs}")
    # print(bvp)
    # fs = 1000
    # print(nk.ppg.ppg_peaks(bvp, fs)[1])
    # ppg_quality = nk.ppg.ppg_quality(bvp)
    # result = np.mean(ppg_quality)
    # print(f"Longitud: {len(bvp)}")
    result = 0
    try:
        result = np.mean(nk.ppg.ppg_quality(bvp), sampling_rate=fs)
    except Warning:
        print(f"\t\t[W] MÉTRICA BVP NO CALCULADA CORRECTAMENTE")
    except Exception:
        print(f"\t\t[E] MÉTRICA BVP NO CALCULADA CORRECTAMENTE")
    return result


def gsr_quality(eda, fs=4):
    """
    Python implementation of Matlab code in Github.

    Böttcher, S., Vieluf, S., Bruno, E., Joseph, B.,
    Epitashvili, N., Biondi, A., ... & Loddenkemper, T. (2022).
    Data quality evaluation in wearable monitoring. Scientific reports, 12(1), 21412.
    """
    print(f"\n\t\tMetric: gsr_quality")
    print(f"\t\tFreq: {fs}")

    quality = {}

    quality["metric1"] = eda
    quality["values1"] = eda >= 0.05

    def getRAC(signal, T=2):
        intervals = range(0, len(signal), T * fs)
        rac = np.full(len(signal), np.nan)

        for ix in intervals:
            if (ix + T * fs - 1) >= len(signal):
                continue

            windowdata = signal[ix : ix + T * fs]
            imin = np.argmin(windowdata)
            vmin = windowdata[imin]

            imax = np.argmax(windowdata)
            vmax = windowdata[imax]

            if imin < imax:
                rac[ix] = (vmax - vmin) / (abs(vmin) + 1e-10)  # Avoid zero division
            elif imin > imax:
                rac[ix] = (vmin - vmax) / (abs(vmax) + 1e-10)

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
    moving_window = 60 * fs

    w_real = moving_window + 1
    cumsum = np.cumsum(np.insert(quality["values"], 0, 0))
    rolling_mean = (cumsum[w_real:] - cumsum[:-w_real]) / float(w_real)
    for i in range(moving_window, 0, -1):
        rolling_mean = np.append(rolling_mean, np.mean(quality["values"][-i:]))

    mean_score = np.mean(rolling_mean[0:len(rolling_mean):moving_window])

    return mean_score


def gsr_automated(data_EDA_uS, fs=4):
    QA_filter_window_EDA_sec = None

    QA_EDA_floor = 0.05
    QA_EDA_ceiling = 60
    QA_EDA_max_slope_uS_per_sec = 10
    QA_radius_to_spread_invalid_datum_sec = 5

    sampling_period_EDA = 1 / fs  # None

    # Rule 1: EDA is out of range (not within 0.05–60 μS)
    if QA_filter_window_EDA_sec:
        windowSize = QA_filter_window_EDA_sec / sampling_period_EDA
        b = (1 / windowSize) * np.ones((int(windowSize),))
        a = 1
        data_EDA_uS_filtered = filtfilt(b, a, data_EDA_uS)
    else:
        data_EDA_uS_filtered = data_EDA_uS

    # Calculate instantaneous slope for Rule 2
    data_Q_EDA_uS_per_sec_filtered_QA = np.insert(
        (np.diff(data_EDA_uS_filtered) / sampling_period_EDA), 0, 0
    )

    # Implementation of EDA rules 1, 2, and (not) 3
    EDA_datum_invalid_123 = (
        (data_EDA_uS_filtered < QA_EDA_floor)
        | (data_EDA_uS_filtered > QA_EDA_ceiling)
        | (abs(data_Q_EDA_uS_per_sec_filtered_QA) > QA_EDA_max_slope_uS_per_sec)
    )

    QA_radius_to_spread_invalid_datum_Ndata = int(
        QA_radius_to_spread_invalid_datum_sec / sampling_period_EDA
    )

    EDA_datum_invalid = EDA_datum_invalid_123.copy()
    for d in range(len(EDA_datum_invalid_123)):
        if EDA_datum_invalid_123[d]:
            EDA_datum_invalid[d : d + QA_radius_to_spread_invalid_datum_Ndata] = 1

            EDA_datum_invalid[
                max(0, d - QA_radius_to_spread_invalid_datum_Ndata + 1) : d
            ] = 1

    return np.mean(~EDA_datum_invalid)


def gsr_automated_2secs(data_EDA_uS, fs=4):
    QA_filter_window_EDA_sec = 2

    QA_EDA_floor = 0.05
    QA_EDA_ceiling = 60
    QA_EDA_max_slope_uS_per_sec = 10
    QA_radius_to_spread_invalid_datum_sec = 5

    sampling_period_EDA = 1 / fs  # None

    # Rule 1: EDA is out of range (not within 0.05–60 μS)
    if QA_filter_window_EDA_sec:
        windowSize = QA_filter_window_EDA_sec / sampling_period_EDA
        b = (1 / windowSize) * np.ones((int(windowSize),))
        a = 1
        data_EDA_uS_filtered = filtfilt(b, a, data_EDA_uS)
    else:
        data_EDA_uS_filtered = data_EDA_uS

    # Calculate instantaneous slope for Rule 2
    data_Q_EDA_uS_per_sec_filtered_QA = np.insert(
        (np.diff(data_EDA_uS_filtered) / sampling_period_EDA), 0, 0
    )

    # Implementation of EDA rules 1, 2, and (not) 3
    EDA_datum_invalid_123 = (
        (data_EDA_uS_filtered < QA_EDA_floor)
        | (data_EDA_uS_filtered > QA_EDA_ceiling)
        | (abs(data_Q_EDA_uS_per_sec_filtered_QA) > QA_EDA_max_slope_uS_per_sec)
    )

    QA_radius_to_spread_invalid_datum_Ndata = int(
        QA_radius_to_spread_invalid_datum_sec / sampling_period_EDA
    )

    EDA_datum_invalid = EDA_datum_invalid_123.copy()
    for d in range(len(EDA_datum_invalid_123)):
        if EDA_datum_invalid_123[d]:
            EDA_datum_invalid[d : d + QA_radius_to_spread_invalid_datum_Ndata] = 1

            EDA_datum_invalid[
                max(0, d - QA_radius_to_spread_invalid_datum_Ndata + 1) : d
            ] = 1

    return np.mean(~EDA_datum_invalid)
