import numpy as np
from scipy.signal import filtfilt, find_peaks


def bottcher_quality(eda, stamps=None, fs=4):
    """
    Python implementation of the WEAR-DataQuality EDA metric by Böttcher et al.

    Higher scores indicate better quality.
    """
    eda = np.asarray(eda, dtype=float)

    def get_rac(signal, window_seconds=2):
        window_samples = int(window_seconds * fs)
        intervals = range(0, len(signal), window_samples)
        rac = np.full(len(signal), np.nan)

        for start in intervals:
            if (start + window_samples) >= len(signal):
                continue

            window = signal[start : start + window_samples]
            min_index = np.argmin(window)
            min_value = window[min_index]
            max_index = np.argmax(window)
            max_value = window[max_index]

            if min_index < max_index:
                rac[start] = (max_value - min_value) / (abs(min_value) + 1e-20)
            elif min_index > max_index:
                rac[start] = (min_value - max_value) / (abs(max_value) + 1e-20)

        last_value = np.nan
        for index in range(len(rac)):
            if not np.isnan(rac[index]):
                last_value = rac[index]
            else:
                rac[index] = last_value

        return rac

    def get_windowed_mm_score(score, window_seconds=60):
        moving_window = int(window_seconds * fs)
        cumsum = np.cumsum(np.insert(score, 0, 0))
        head_mean = (cumsum[moving_window:] - cumsum[:-moving_window]) / moving_window
        tail_means = np.array(
            [np.mean(score[-i:]) for i in range(moving_window - 1, 0, -1)]
        )
        score_mm = np.concatenate((head_mean, tail_means))
        max_length = min(len(score), len(stamps)) if stamps is not None else len(score)
        return score_mm[:max_length:moving_window]

    quality_values = (eda >= 0.05) & (np.abs(get_rac(eda)) < 0.2)
    score_windowed = get_windowed_mm_score(quality_values)
    return float(np.mean(score_windowed))


def kleckner_quality(
    data_eda_us,
    fs=4,
    data_time_sec=None,
    data_temperature_c=None,
    qa_filter_window_eda_sec=None,
    qa_eda_floor=0.05,
    qa_eda_ceiling=60,
    qa_eda_max_slope_us_per_sec=10,
    qa_temperature_c_min=30,
    qa_temperature_c_max=40,
    qa_radius_to_spread_invalid_datum_sec=5,
):
    """
    Python implementation of the automated EDAQA metric by Kleckner et al.

    Higher scores indicate better quality.
    """
    data_eda_us = np.asarray(data_eda_us, dtype=float)
    data_time_sec = [] if data_time_sec is None else list(data_time_sec)

    if data_temperature_c is None or len(data_temperature_c) == 0:
        qa_temperature_c_min = 0
        qa_temperature_c_max = 1
        data_temperature_c = 0.5 * np.ones(len(data_eda_us))
    else:
        data_temperature_c = np.asarray(data_temperature_c, dtype=float)
        if qa_temperature_c_min >= qa_temperature_c_max:
            raise ValueError("Temperature min must be less than temperature max")

    if (
        (len(data_time_sec) != 0 and len(data_eda_us) != len(data_time_sec))
        or (len(data_temperature_c) != 0 and len(data_eda_us) != len(data_temperature_c))
        or (
            len(data_time_sec) != 0
            and len(data_temperature_c) != 0
            and len(data_time_sec) != len(data_temperature_c)
        )
    ):
        raise ValueError(
            "Input data must all be the same length. If you do not have temperature or time data, use []"
        )

    if qa_eda_floor >= qa_eda_ceiling:
        raise ValueError("EDA floor must be less than EDA ceiling")

    sampling_period_eda = (
        float(data_time_sec[1] - data_time_sec[0]) if len(data_time_sec) > 1 else 1 / fs
    )

    if qa_filter_window_eda_sec:
        window_size = qa_filter_window_eda_sec / sampling_period_eda
        kernel = (1 / window_size) * np.ones(int(window_size))
        data_eda_us_filtered = filtfilt(kernel, 1, data_eda_us)
        data_temperature_c_filtered = filtfilt(kernel, 1, data_temperature_c)

        if np.sum(~np.isnan(data_temperature_c_filtered)) == 0:
            data_temperature_c_filtered = data_temperature_c
    else:
        data_eda_us_filtered = data_eda_us
        data_temperature_c_filtered = data_temperature_c

    data_q_eda_us_per_sec_filtered_qa = np.insert(
        np.diff(data_eda_us_filtered) / sampling_period_eda,
        0,
        0,
    )

    eda_datum_invalid_123 = (
        (data_eda_us_filtered < qa_eda_floor)
        | (data_eda_us_filtered > qa_eda_ceiling)
        | (np.abs(data_q_eda_us_per_sec_filtered_qa) > qa_eda_max_slope_us_per_sec)
        | (data_temperature_c_filtered < qa_temperature_c_min)
        | (data_temperature_c_filtered > qa_temperature_c_max)
    )

    spread_samples = int(qa_radius_to_spread_invalid_datum_sec / sampling_period_eda)
    eda_datum_invalid = eda_datum_invalid_123.copy()

    for index, is_invalid in enumerate(eda_datum_invalid_123):
        if not is_invalid:
            continue
        eda_datum_invalid[index : index + spread_samples] = 1
        eda_datum_invalid[max(0, index - spread_samples + 1) : index] = 1

    return float(np.mean(~eda_datum_invalid))


def kleckner_quality_filter(data_eda_us, fs=4):
    """
    Kleckner quality metric with the 2-second pre-filter variant.
    """
    return kleckner_quality(
        data_eda_us,
        fs=fs,
        qa_filter_window_eda_sec=2,
    )


def maki_quality(data, fs=64, min_peak_distance=60 / 240, min_peak_height=0):
    """
    Python implementation of the Q_PHV reliability metric by Maki et al.

    Lower scores indicate more stable pulse heights and therefore better quality.
    """
    data = np.asarray(data, dtype=float)
    min_peak_distance_samples = max(1, int(round(min_peak_distance * fs)))

    def normalize_mean_peak_height(values):
        centered = values - np.mean(values)
        peak_indices, _ = find_peaks(
            centered,
            height=min_peak_height,
            distance=min_peak_distance_samples,
        )
        peaks = centered[peak_indices]
        if peaks.size == 0 or np.isclose(np.mean(peaks), 0):
            raise ValueError("Unable to normalize signal: no valid peaks found.")
        return centered / np.mean(peaks)

    normalized_signal = normalize_mean_peak_height(data)
    peak_indices, _ = find_peaks(
        normalized_signal,
        height=min_peak_height,
        distance=min_peak_distance_samples,
    )
    peaks = normalized_signal[peak_indices]
    if peaks.size <= 1:
        return 0.0

    return float(np.var(peaks, ddof=1))
