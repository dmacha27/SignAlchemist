/* global jest, describe, beforeEach, afterEach, it, expect */

import React from "react";
import { act } from "@testing-library/react";
import { fireEvent, render, screen, userEvent } from "../../test-utils";
import CustomChart from "./CustomChart";
import * as chartUtils from "../utils/chartUtils";
import { chartGroups } from "./echartsBridge";

const mockGetDataURL = jest.fn(() => "data:image/png;base64,mock");
const mockDispatchAction = jest.fn();
const mockZrOn = jest.fn();
const mockZrHandlers = {};
const mockEchartsInstance = {
  getDataURL: mockGetDataURL,
  dispatchAction: mockDispatchAction,
  getZr: () => ({
    on: (eventName, handler) => {
      mockZrOn(eventName, handler);
      mockZrHandlers[eventName] = handler;
    },
    off: (eventName) => {
      delete mockZrHandlers[eventName];
    },
  }),
  containPixel: () => true,
  convertFromPixel: () => [2000, 0],
};

jest.mock("echarts-for-react", () => {
  const React = jest.requireActual("react");

  return React.forwardRef(({ onEvents }, ref) => {
    React.useImperativeHandle(ref, () => ({
      getEchartsInstance: () => mockEchartsInstance,
    }));

    return (
      <div
        data-testid="mock-echart"
        onClick={() => onEvents?.click?.({ dataIndex: 2 })}
        onMouseMove={() => onEvents?.mousemove?.({ dataIndex: 2, value: [2000, 2.2] })}
      />
    );
  });
});

const mockEDA = [
  ["Timestamp", "Gsr"],
  [0, 1.1],
  [1, 1.5],
  [2, 2.2],
  [3, 2.5],
  [4, 3.3],
  [5, 3.5],
  [6, 4.4],
];

const mockResampledEDA = [
  ["Timestamp", "Gsr"],
  [0, 1.1],
  [2, 2.2],
  [4, 3.3],
  [6, 4.4],
];

describe("CustomChart", () => {
  beforeEach(() => {
    chartGroups.signal.clear();
    chartGroups.spectrum.clear();
    jest.spyOn(chartUtils, "exportToPNG").mockImplementation(() => {});
    jest.spyOn(chartUtils, "handleResetZoom").mockImplementation(() => {});
    jest.spyOn(chartUtils, "handleResetStyle").mockImplementation(() => {});
    jest.spyOn(chartUtils, "processChartHighlight").mockImplementation(() => {});
    mockGetDataURL.mockClear();
    mockDispatchAction.mockClear();
    mockZrOn.mockClear();
    Object.keys(mockZrHandlers).forEach((key) => delete mockZrHandlers[key]);
  });

  afterEach(() => {
    jest.clearAllMocks();
    chartGroups.signal.clear();
    chartGroups.spectrum.clear();
  });

  it("renders the echarts chart with controls for a small dataset", () => {
    render(<CustomChart table={mockEDA} />);

    expect(screen.getByTestId("mock-echart")).toBeInTheDocument();
    expect(screen.getByText("Reset Zoom")).toBeInTheDocument();
    expect(screen.getByText("Reset Style")).toBeInTheDocument();
  });

  it("renders warning and disables controls with a large dataset", () => {
    const largeDataset = [
      ["Timestamp", "Gsr"],
      ...Array.from({ length: 6000 }, (_, i) => [i, Math.random() * 10]),
    ];

    render(<CustomChart table={largeDataset} />);

    expect(screen.getByTestId("mock-echart")).toBeInTheDocument();
    expect(screen.getByText(/Large dataset\. Interaction off\./i)).toBeInTheDocument();
    expect(screen.queryByText(/Reset Zoom/i)).not.toBeInTheDocument();
  });

  it("calls exportToPNG when PNG is selected", async () => {
    render(<CustomChart table={mockEDA} />);

    await userEvent.click(screen.getByLabelText("export"));
    await userEvent.click(await screen.findByText("PNG"));

    expect(chartUtils.exportToPNG).toHaveBeenCalledTimes(1);
  });

  it("calls handleResetZoom when reset zoom is clicked", async () => {
    render(<CustomChart table={mockEDA} />);

    await userEvent.click(screen.getByText(/Reset Zoom/i));

    expect(chartUtils.handleResetZoom).toHaveBeenCalledTimes(1);
  });

  it("calls handleResetStyle when reset style is clicked", async () => {
    render(<CustomChart table={mockEDA} />);

    await userEvent.click(screen.getByText(/Reset Style/i));

    expect(chartUtils.handleResetStyle).toHaveBeenCalledTimes(1);
  });

  it("calls processChartHighlight on point click", () => {
    render(<CustomChart table={mockEDA} />);

    fireEvent.click(screen.getByTestId("mock-echart"));

    expect(chartUtils.processChartHighlight).toHaveBeenCalled();
  });

  it("syncs hover and clears tooltip on mouse out", () => {
    render(
      <>
        <CustomChart table={mockEDA} />
        <CustomChart table={mockEDA} />
      </>
    );

    const charts = screen.getAllByTestId("mock-echart");
    act(() => {
      fireEvent.mouseMove(charts[0]);
      mockZrHandlers.mousemove?.({ offsetX: 120, offsetY: 40 });
    });
    act(() => {
      fireEvent.mouseLeave(charts[0].parentElement);
    });

    expect(mockDispatchAction).toHaveBeenCalledWith(
      expect.objectContaining({ type: "showTip" })
    );
    expect(mockDispatchAction).toHaveBeenCalledWith(
      expect.objectContaining({ type: "hideTip" })
    );
  });

  it("syncs hover by x value when split charts have different lengths", () => {
    render(
      <>
        <CustomChart table={mockEDA} />
        <CustomChart table={mockResampledEDA} />
      </>
    );

    const charts = screen.getAllByTestId("mock-echart");
    act(() => {
      mockZrHandlers.mousemove?.({ offsetX: 120, offsetY: 40 });
    });

    expect(mockDispatchAction).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "showTip",
        dataIndex: 1,
      })
    );
  });

  it("shows tooltip when hovering the plot area away from an exact point", () => {
    render(<CustomChart table={mockEDA} />);

    act(() => {
      mockZrHandlers.mousemove?.({ offsetX: 160, offsetY: 140 });
    });

    expect(mockDispatchAction).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "showTip",
        dataIndex: 2,
      })
    );
  });
});
