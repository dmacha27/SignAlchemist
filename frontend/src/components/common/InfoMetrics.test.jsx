import { render, screen } from "../../test-utils";
import InfoMetrics from "./InfoMetrics";

const mockMetricsOriginal = {
  metricA: { value: 0.967534, description: "Gadea et al." },
  metricB: { value: 0.655444, description: "Gadea et al." },
};

const mockMetricsProcessed = {
  metricA: { value: 1.0, description: "Gadea et al." },
  metricB: { value: 0.93, description: "Gadea et al." },
};

describe("InfoMetrics", () => {
  test("MetricsOriginal: NO, MetricsProcessed: NO, isRequesting: NO — shows loader and ask user to run processing", () => {
    render(<InfoMetrics isRequesting={false} />);
    expect(screen.getByText(/Calculating.../i)).toBeInTheDocument();

    expect(
      screen.getByText(/Please run processing to see results./i)
    ).toBeInTheDocument();
  });

  test("MetricsOriginal: NO, MetricsProcessed: NO, isRequesting: YES — shows loader and loader", () => {
    render(<InfoMetrics isRequesting={true} />);
    expect(screen.getByText(/Calculating.../i)).toBeInTheDocument();

    expect(screen.getByText(/Processing request.../i)).toBeInTheDocument();
  });

  test("MetricsOriginal: YES, MetricsProcessed: NO, isRequesting: NO (CHECKS DEFAULT) — shows original metrics and ask user to run processing", () => {
    render(
      <InfoMetrics metricsOriginal={mockMetricsOriginal} /> // Checking also default value of isRequesting
    );
    expect(screen.getByText("metricA")).toBeInTheDocument();
    expect(screen.getByText("0.9675")).toBeInTheDocument(); // Metric value should be fixed to 4 digits
    expect(screen.getByText("metricB")).toBeInTheDocument();
    expect(screen.getByText("0.6554")).toBeInTheDocument();

    expect(
      screen.getByText(/Please run processing to see results./i)
    ).toBeInTheDocument();
  });

  test("MetricsOriginal: YES, MetricsProcessed: NO, isRequesting: YES — shows original metrics and loader", () => {
    render(
      <InfoMetrics metricsOriginal={mockMetricsOriginal} isRequesting={true} />
    );
    expect(screen.getByText("metricA")).toBeInTheDocument();
    expect(screen.getByText("0.9675")).toBeInTheDocument(); // Metric value should be fixed to 4 digits
    expect(screen.getByText("metricB")).toBeInTheDocument();
    expect(screen.getByText("0.6554")).toBeInTheDocument();

    expect(screen.getByText(/Processing request.../i)).toBeInTheDocument();
  });

  test("MetricsOriginal: NO, MetricsProcessed: YES, isRequesting: NO — shows loader and processed metrics", () => {
    render(
      <InfoMetrics
        metricsProcessed={mockMetricsProcessed}
        isRequesting={false}
      />
    );
    expect(screen.getByText(/Calculating.../i)).toBeInTheDocument();
    
    expect(screen.getByText("metricA")).toBeInTheDocument();
    expect(screen.getByText("1.0000")).toBeInTheDocument();
    expect(screen.getByText("metricB")).toBeInTheDocument();
    expect(screen.getByText("0.9300")).toBeInTheDocument();
  });

  test("MetricsOriginal: NO, MetricsProcessed: YES, isRequesting: YES — shows loader and loader", () => {
    render(
      <InfoMetrics
        metricsProcessed={mockMetricsProcessed}
        isRequesting={true}
      />
    );
    expect(screen.getByText(/Calculating.../i)).toBeInTheDocument();

    //This one is a bit tricky but maybe processed metrics are outdated
    expect(screen.getByText(/Processing request.../i)).toBeInTheDocument();
  });

  test("MetricsOriginal: YES, MetricsProcessed: YES, isRequesting: NO — shows both metric sets", () => {
    render(
      <InfoMetrics
        metricsOriginal={mockMetricsOriginal}
        metricsProcessed={mockMetricsProcessed}
        isRequesting={false}
      />
    );
    expect(screen.getAllByText("metricA")).toHaveLength(2);
    expect(screen.getAllByText("metricB")).toHaveLength(2);
  });

  test("MetricsOriginal: YES, MetricsProcessed: YES, isRequesting: YES — shows original metrics and loader", () => {
    render(
      <InfoMetrics
        metricsOriginal={mockMetricsOriginal}
        metricsProcessed={mockMetricsProcessed}
        isRequesting={true}
      />
    );
    expect(screen.getByText("metricA")).toBeInTheDocument();
    expect(screen.getByText("0.9675")).toBeInTheDocument();
    expect(screen.getByText("metricB")).toBeInTheDocument();
    expect(screen.getByText("0.6554")).toBeInTheDocument();

    expect(screen.getByText(/Processing request.../i)).toBeInTheDocument();
  });
});
