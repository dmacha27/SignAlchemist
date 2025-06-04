import { render, screen } from "../../test-utils";
import PipelineSteps from "./PipelineSteps";

const mockNormalFlow = [
  {
    id: "1",
    type: "InputSignal",
    data: {
      target: "3",
    },
  },
  {
    id: "2",
    type: "OutputSignal",
    data: {},
  },
  {
    id: "3",
    type: "OutliersNode",
    data: {
      target: "4",
      technique: '{"name":"hampel"}',
    },
  },
  {
    id: "4",
    type: "FilteringNode",
    data: {
      target: "5",
      technique:
        '{"name":"butterworth","fields":{"order":2,"lowcut":null,"highcut":1}}',
    },
  },
  {
    id: "5",
    type: "OutputSignal",
    data: {},
  },
];

const mockTargetLoop = [
  {
    id: "1",
    type: "InputSignal",
    data: {
      target: "2",
    },
  },
  {
    id: "2",
    type: "OutliersNode",
    data: {
      target: "2",
      technique: '{"name":"hampel"}',
    },
  },
];

const mockBadIds = [
  {
    id: "1",
    type: "InputSignal",
    data: {
      target: "3",
    },
  },
  {
    id: "3",
    type: "OutliersNode",
    data: {
      target: "27",
      technique: '{"name":"hampel"}',
    },
  },
  {
    type: "NOID",
  },
];

const mockLongField = [
  {
    id: "1",
    type: "InputSignal",
    data: {
      target: "2",
    },
  },
  {
    id: "2",
    type: "FilteringNode",
    data: {
      technique:
        '{"name":"butterworth","fields":{"python":"def filter_signal(signal): \\n\\tnew_values = scipy.ndimage.gaussian_filter1d(signal, sigma=30) \\n\\treturn new_values"}}',
    },
  },
];

describe("PipelineSteps", () => {
  test("renders steps without errors", () => {
    render(<PipelineSteps nodes={mockNormalFlow} />);

    expect(screen.getByText("InputSignal")).toBeInTheDocument();
    expect(screen.getByText("OutliersNode")).toBeInTheDocument();
    expect(screen.getByText("FilteringNode")).toBeInTheDocument();
    expect(screen.getByText("OutputSignal")).toBeInTheDocument();

    expect(screen.getByText(/Hampel/i)).toBeInTheDocument(); // Also checking capital letters
    expect(screen.getByText(/Butterworth/i)).toBeInTheDocument();
  });

  test("controls infinite target loop", () => {
    render(<PipelineSteps nodes={mockTargetLoop} />);

    expect(screen.getByText("InputSignal")).toBeInTheDocument();
    expect(screen.getByText("OutliersNode")).toBeInTheDocument();
    expect(screen.queryAllByText("OutliersNode")).toHaveLength(1); // only one instance
  });

  test("handles bad ids", () => {
    render(<PipelineSteps nodes={mockBadIds} />);

    expect(screen.getByText("InputSignal")).toBeInTheDocument();
    expect(screen.getByText("OutliersNode")).toBeInTheDocument();
    expect(() => screen.getByText("FilteringNode")).toThrow();
    expect(() => screen.getByText("OutputSignal")).toThrow();
    expect(() => screen.getByText("NOID")).toThrow();
  });

  test("handles empty nodes", () => {
    render(<PipelineSteps nodes={[]} />);

    expect(screen.getByText("No steps to display.")).toBeInTheDocument();
  });

  test("handles long field (popover)", () => {
    render(<PipelineSteps nodes={mockLongField} />);

    expect(screen.getByText("Click")).toBeInTheDocument();
  });
});
