import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

import { average, diff } from "../utils/dataUtils";

function formatDuration(seconds, t) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return t("table.minutesSeconds", { minutes: mins, seconds: secs });
}

const SignalSummary = ({ table }) => {
  const { t } = useTranslation();
  if (!table || table.length < 2) {
    return null;
  }

  const data = table.slice(1);
  const duration = data[data.length - 1][0] - data[0][0];
  const signalLength = data.length;
  const samplingRateCalculated = 1 / average(diff(data.map((row) => row[0])));

  return (
    <div className="rounded-[1rem] border border-slate-200 bg-white/85 p-3 text-sm text-slate-700 dark:border-gray-700 dark:bg-gray-950/70 dark:text-slate-200">
      <div className="grid gap-2 sm:grid-cols-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            {t("table.duration")}
          </p>
          <p className="mt-1 font-semibold">{formatDuration(duration, t)}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            {t("table.samplingRate")}
          </p>
          <p className="mt-1 font-semibold" title={`${samplingRateCalculated} Hz`}>
            {samplingRateCalculated.toFixed(2)} Hz
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            {t("table.samples")}
          </p>
          <p className="mt-1 font-semibold">{signalLength}</p>
        </div>
      </div>
    </div>
  );
};

SignalSummary.propTypes = {
  table: PropTypes.arrayOf(
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number]))
  ),
};

SignalSummary.defaultProps = {
  table: null,
};

export default SignalSummary;
