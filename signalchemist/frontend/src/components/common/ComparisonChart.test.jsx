/* global jest, describe, beforeEach, afterEach, it, expect */

import React from "react";
import { fireEvent, render, screen, userEvent } from "../../test-utils";
import ComparisonChart from "./ComparisonChart";
import * as chartUtils from "../utils/chartUtils";

const mockGetDataURL = jest.fn(() => "data:image/png;base64,mock");

jest.mock("echarts-for-react", () => {
  const React = jest.requireActual("react");

  return React.forwardRef(({ onEvents }, ref) => {
    React.useImperativeHandle(ref, () => ({
      getEchartsInstance: () => ({
        getDataURL: mockGetDataURL,
      }),
    }));

    return (
      <div
        data-testid="mock-echart"
        onClick={() => onEvents?.click?.({ dataIndex: 2 })}
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

describe("ComparisonChart", () => {
  beforeEach(() => {
    jest.spyOn(chartUtils, "exportToPNG").mockImplementation(() => {});
    jest.spyOn(chartUtils, "handleResetZoom").mockImplementation(() => {});
    jest.spyOn(chartUtils, "handleResetStyle").mockImplementation(() => {});
    mockGetDataURL.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the echarts comparison chart", () => {
    render(<ComparisonChart table1={mockEDA} table2={mockEDA} name2="Test" />);

    expect(screen.getByTestId("mock-echart")).toBeInTheDocument();
    expect(screen.getByText("Reset Zoom")).toBeInTheDocument();
    expect(screen.getByText("Reset Style")).toBeInTheDocument();
  });

  it("renders warning and disables controls with a large dataset", () => {
    const largeDataset = [
      ["Timestamp", "Gsr"],
      ...Array.from({ length: 6000 }, (_, i) => [i, Math.random() * 10]),
    ];

    render(<ComparisonChart table1={largeDataset} table2={mockEDA} name2="Test" />);

    expect(screen.getByTestId("mock-echart")).toBeInTheDocument();
    expect(screen.getByText(/Large dataset\. Interaction off\./i)).toBeInTheDocument();
    expect(screen.queryByText(/Reset Zoom/i)).not.toBeInTheDocument();
  });

  it("calls exportToPNG when PNG is selected", async () => {
    render(<ComparisonChart table1={mockEDA} table2={mockEDA} name2="Test" />);

    await userEvent.click(screen.getByLabelText("export"));
    await userEvent.click(await screen.findByText("PNG"));

    expect(chartUtils.exportToPNG).toHaveBeenCalledTimes(1);
  });

  it("calls handleResetZoom when reset zoom is clicked", async () => {
    render(<ComparisonChart table1={mockEDA} table2={mockEDA} name2="Test" />);

    await userEvent.click(screen.getByText(/Reset Zoom/i));

    expect(chartUtils.handleResetZoom).toHaveBeenCalledTimes(1);
  });

  it("calls handleResetStyle when reset style is clicked", async () => {
    render(<ComparisonChart table1={mockEDA} table2={mockEDA} name2="Test" />);

    await userEvent.click(screen.getByText(/Reset Style/i));

    expect(chartUtils.handleResetStyle).toHaveBeenCalledTimes(1);
  });

  it("keeps the plot clickable", () => {
    render(<ComparisonChart table1={mockEDA} table2={mockEDA} name2="Test" />);

    fireEvent.click(screen.getByTestId("mock-echart"));

    expect(screen.getByTestId("mock-echart")).toBeInTheDocument();
  });
});
