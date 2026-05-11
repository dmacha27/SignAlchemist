/* global jest, describe, beforeEach, afterEach, it, expect */

import React from "react";
import { act } from "@testing-library/react";
import { fireEvent, render, screen, userEvent } from "../../test-utils";
import SpectrumChart from "./SpectrumChart";
import * as chartUtils from "../utils/chartUtils";
import { chartGroups } from "./echartsBridge";

const mockGetDataURL = jest.fn(() => "data:image/png;base64,mock");
const mockDispatchAction = jest.fn();
const mockZrHandlers = {};

jest.mock("echarts-for-react", () => {
  const React = jest.requireActual("react");

  return React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({
      getEchartsInstance: () => ({
        getDataURL: mockGetDataURL,
        dispatchAction: mockDispatchAction,
        getZr: () => ({
          on: (eventName, handler) => {
            mockZrHandlers[eventName] = handler;
          },
        }),
        containPixel: () => true,
        convertFromPixel: () => [0.2, 0],
      }),
    }));

    return <div data-testid="mock-echart" />;
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
  [7, 4.7],
];

describe("SpectrumChart", () => {
  beforeEach(() => {
    chartGroups.signal.clear();
    chartGroups.spectrum.clear();
    jest.spyOn(chartUtils, "exportToPNG").mockImplementation(() => {});
    jest.spyOn(chartUtils, "handleResetZoom").mockImplementation(() => {});
    jest.spyOn(chartUtils, "handleResetStyle").mockImplementation(() => {});
    mockGetDataURL.mockClear();
    mockDispatchAction.mockClear();
    Object.keys(mockZrHandlers).forEach((key) => delete mockZrHandlers[key]);
  });

  afterEach(() => {
    jest.clearAllMocks();
    chartGroups.signal.clear();
    chartGroups.spectrum.clear();
  });

  it("renders the spectrum chart", () => {
    render(<SpectrumChart table={mockEDA} />);

    expect(screen.getByTestId("mock-echart")).toBeInTheDocument();
    expect(screen.getByText("Reset Zoom")).toBeInTheDocument();
    expect(screen.getByText("Reset Style")).toBeInTheDocument();
  });

  it("renders warning and disables controls with a large dataset", () => {
    const largeDataset = [
      ["Timestamp", "Gsr"],
      ...Array.from({ length: 10000 }, (_, i) => [i, Math.random() * 10]),
    ];

    render(<SpectrumChart table={largeDataset} />);

    expect(screen.getByTestId("mock-echart")).toBeInTheDocument();
    expect(screen.getByText(/Large dataset\. Interaction off\./i)).toBeInTheDocument();
    expect(screen.queryByText(/Reset Zoom/i)).not.toBeInTheDocument();
  });

  it("calls exportToPNG when PNG is selected", async () => {
    render(<SpectrumChart table={mockEDA} />);

    await userEvent.click(screen.getByLabelText("export"));
    await userEvent.click(await screen.findByText("PNG"));

    expect(chartUtils.exportToPNG).toHaveBeenCalledTimes(1);
  });

  it("calls handleResetZoom when reset zoom is clicked", async () => {
    render(<SpectrumChart table={mockEDA} />);

    await userEvent.click(screen.getByText(/Reset Zoom/i));

    expect(chartUtils.handleResetZoom).toHaveBeenCalledTimes(1);
  });

  it("calls handleResetStyle when reset style is clicked", async () => {
    render(<SpectrumChart table={mockEDA} />);

    await userEvent.click(screen.getByText(/Reset Style/i));

    expect(chartUtils.handleResetStyle).toHaveBeenCalledTimes(1);
  });

  it("applies X focus on go", async () => {
    render(<SpectrumChart table={mockEDA} />);

    fireEvent.change(screen.getByPlaceholderText("Go to X"), {
      target: { value: 0.2 },
    });
    await userEvent.click(screen.getByLabelText("go-x"));

    expect(chartUtils.handleResetZoom).toHaveBeenCalledTimes(1);
    expect(chartUtils.handleResetStyle).toHaveBeenCalledTimes(1);
  });

  it("applies X focus to both spectrum charts", async () => {
    render(
      <>
        <SpectrumChart table={mockEDA} />
        <SpectrumChart table={mockEDA} />
      </>
    );

    fireEvent.change(screen.getAllByPlaceholderText("Go to X")[0], {
      target: { value: 0.2 },
    });
    await userEvent.click(screen.getAllByLabelText("both-x")[0]);

    expect(chartUtils.handleResetZoom).toHaveBeenCalledTimes(2);
    expect(chartUtils.handleResetStyle).toHaveBeenCalledTimes(2);
  });

  it("applies Y band on go", async () => {
    render(<SpectrumChart table={mockEDA} />);

    fireEvent.change(screen.getByPlaceholderText("Y min"), {
      target: { value: 5 },
    });
    fireEvent.change(screen.getByPlaceholderText("Y max"), {
      target: { value: 15 },
    });
    await userEvent.click(screen.getByLabelText("go-y"));

    expect(chartUtils.handleResetZoom).toHaveBeenCalledTimes(1);
    expect(chartUtils.handleResetStyle).toHaveBeenCalledTimes(1);
  });

  it("applies Y band to both spectrum charts", async () => {
    render(
      <>
        <SpectrumChart table={mockEDA} />
        <SpectrumChart table={mockEDA} />
      </>
    );

    fireEvent.change(screen.getAllByPlaceholderText("Y min")[0], {
      target: { value: 3 },
    });
    fireEvent.change(screen.getAllByPlaceholderText("Y max")[0], {
      target: { value: 20 },
    });
    await userEvent.click(screen.getAllByLabelText("both-y")[0]);

    expect(chartUtils.handleResetZoom).toHaveBeenCalledTimes(2);
    expect(chartUtils.handleResetStyle).toHaveBeenCalledTimes(2);
  });

  it("syncs hover across spectrum charts", () => {
    render(
      <>
        <SpectrumChart table={mockEDA} />
        <SpectrumChart table={mockEDA} />
      </>
    );

    act(() => {
      mockZrHandlers.mousemove?.({ offsetX: 120, offsetY: 40 });
    });
    act(() => {
      mockZrHandlers.globalout?.();
    });

    expect(mockDispatchAction).toHaveBeenCalledWith(
      expect.objectContaining({ type: "showTip" })
    );
    expect(mockDispatchAction).toHaveBeenCalledWith(
      expect.objectContaining({ type: "hideTip" })
    );
  });
});
