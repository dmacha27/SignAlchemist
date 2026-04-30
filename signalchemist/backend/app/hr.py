import numpy as np
import neurokit2


class DigitalFilter:
    DIGITAL_FILTER_PI = 3.1415926535897932384626433832795
    DIGITAL_FILTER_E = 2.7182818284590452353602874713526

    def __init__(self, filtertype, sampling_freq, filter_freq1):
        self._type = filtertype
        self._alpha = pow(
            self.DIGITAL_FILTER_E,
            -2.0 * self.DIGITAL_FILTER_PI * filter_freq1 / sampling_freq
        )
        self._n_init_samples = 0
        self._n_poles = 1
        self._filtered_value = 0.0

    def filter(self, input_sample):
        if self._n_init_samples < self._n_poles:
            self._filtered_value = input_sample
            self._n_init_samples += 1

        if self._type == "IIR_LOWPASS":
            self._filtered_value = (
                input_sample * (1.0 - self._alpha)
                + self._filtered_value * self._alpha
            )
            return self._filtered_value

        if self._type == "IIR_HIGHPASS":
            self._filtered_value = (
                input_sample * (1.0 - self._alpha)
                + self._filtered_value * self._alpha
            )
            return input_sample - self._filtered_value

        return 0.0


def _empty_heart_rate_result():
    return np.empty((0, 2), dtype=np.float64)


def detect_ppg_peaks(values, sampling_rate: int):
    cleaned = neurokit2.ppg_clean(values, sampling_rate=sampling_rate)
    info = neurokit2.ppg_findpeaks(
        cleaned,
        sampling_rate=sampling_rate,
        method="elgendi",
    )
    return np.asarray(info["PPG_Peaks"], dtype=int)


def compute_emotibit_heart_rate(data, sampling_rate: int):
    if len(data) == 0:
        return _empty_heart_rate_result()

    timestamps = data[:, 0]
    signal = data[:, 1]
    peaks = detect_ppg_peaks(signal, sampling_rate)

    heart_rate_filter = DigitalFilter("IIR_LOWPASS", sampling_rate, 1)
    time_period_ms = (1.0 / sampling_rate) * 1000.0

    beats = np.zeros(len(signal), dtype=int)
    beats[peaks] = 1

    heart_rates = []
    beat_timestamps = []
    inter_beat_sample_count = 0

    for index, has_beat in enumerate(beats):
        inter_beat_sample_count += 1

        if has_beat:
            inter_beat_interval = inter_beat_sample_count * time_period_ms
            heart_rate = (60.0 / inter_beat_interval) * 1000.0
            heart_rate = heart_rate_filter.filter(heart_rate)

            heart_rates.append(heart_rate)
            beat_timestamps.append(timestamps[index])
            inter_beat_sample_count = 0

    if not heart_rates:
        return _empty_heart_rate_result()

    return np.column_stack((beat_timestamps, heart_rates))


def compute_neurokit_heart_rate(data, sampling_rate: int):
    if len(data) == 0:
        return _empty_heart_rate_result()

    timestamps = data[:, 0]
    signal = data[:, 1]

    signals, _ = neurokit2.ppg_process(signal, sampling_rate=sampling_rate)
    peak_mask = np.asarray(signals["PPG_Peaks"].values, dtype=bool)
    rate_values = np.asarray(signals["PPG_Rate"].values, dtype=np.float64)

    if not peak_mask.any():
        return _empty_heart_rate_result()

    return np.column_stack((timestamps[peak_mask], rate_values[peak_mask]))
