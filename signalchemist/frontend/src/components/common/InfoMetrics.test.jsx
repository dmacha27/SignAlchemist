import React from "react";
import { render, screen } from "../../test-utils";
import InfoMetrics from "./InfoMetrics";

const mockMetricsOriginal = {
  metricA: {
    metric_id: "metric_a",
    value: 0.967534,
    preference: "higher",
    description: "EDA quality score. Higher is better.",
  },
  metricB: {
    metric_id: "metric_b",
    value: 0.655444,
    preference: "lower",
    description: "Pulse variability score. Lower is better.",
  },
};

const mockMetricsProcessed = {
  metricA: {
    metric_id: "metric_a",
    value: 1.0,
    preference: "higher",
    description: "EDA quality score. Higher is better.",
  },
  metricB: {
    metric_id: "metric_b",
    value: 0.93,
    preference: "lower",
    description: "Pulse variability score. Lower is better.",
  },
};

describe("InfoMetrics", () => {
  test("shows calculating loader when original metrics are not ready", () => {
    render(<InfoMetrics />);

    expect(screen.getByText(/Calculating.../i)).toBeInTheDocument();
  });

  test("shows processing loader when a request is in progress after original metrics exist", () => {
    render(
      <InfoMetrics
        metricsOriginal={mockMetricsOriginal}
        isRequesting={true}
      />
    );

    expect(screen.getByText(/Processing request.../i)).toBeInTheDocument();
  });

  test("renders original metrics even when processed metrics are missing", () => {
    render(<InfoMetrics metricsOriginal={mockMetricsOriginal} />);

    expect(screen.getByText("Metrics")).toBeInTheDocument();
    expect(screen.getByText("metricA")).toBeInTheDocument();
    expect(screen.getByText("metricB")).toBeInTheDocument();
    expect(screen.getAllByText("Pending")).toHaveLength(2);
  });

  test("renders the metrics comparison layout", () => {
    render(
      <InfoMetrics
        metricsOriginal={mockMetricsOriginal}
        metricsProcessed={mockMetricsProcessed}
      />
    );

    expect(screen.getByText("Metrics")).toBeInTheDocument();
    expect(screen.getByLabelText("metricA slope")).toBeInTheDocument();
    expect(screen.getByLabelText("metricB slope")).toBeInTheDocument();
  });

  test("shows metric names, values and trend badges", () => {
    render(
      <InfoMetrics
        metricsOriginal={mockMetricsOriginal}
        metricsProcessed={mockMetricsProcessed}
      />
    );

    expect(screen.getByText("metricA")).toBeInTheDocument();
    expect(screen.getByText("metricB")).toBeInTheDocument();
    expect(screen.getByText("0.9675")).toBeInTheDocument();
    expect(screen.getByText("1.0000")).toBeInTheDocument();
    expect(screen.getByText("0.6554")).toBeInTheDocument();
    expect(screen.getByText("0.9300")).toBeInTheDocument();
    expect(screen.getByText("Improved")).toBeInTheDocument();
    expect(screen.getByText("Worse")).toBeInTheDocument();
  });

  test("shows compact metric metadata in the comparison rows", () => {
    render(
      <InfoMetrics
        metricsOriginal={mockMetricsOriginal}
        metricsProcessed={mockMetricsProcessed}
      />
    );

    expect(screen.getAllByText("Higher is better")).toHaveLength(1);
    expect(screen.getAllByText("Lower is better")).toHaveLength(1);
    expect(screen.getAllByText(/Delta:/)).toHaveLength(2);
  });
});
