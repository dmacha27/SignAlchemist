/* global jest, describe, beforeAll, it, expect, global */

import { render, screen, fireEvent, waitFor } from "../test-utils";
import { BrowserRouter } from "react-router-dom";
import Home from "./Home";
import { ThemeContext } from "../contexts/ThemeContext";

jest.mock("echarts-for-react", () => {
  const React = jest.requireActual("react");

  return React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({
      getEchartsInstance: () => ({
        getDataURL: jest.fn(() => "data:image/png;base64,mock"),
        dispatchAction: jest.fn(),
      }),
    }));

    return <div data-testid="mock-echart" />;
  });
});

const mockTheme = {
  isDarkMode: false,
  toggleDarkMode: jest.fn(),
};

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
const csvContent = mockEDA.map((row) => row.join(",")).join("\n");
const csvContentNoHeader = mockEDA
  .slice(1)
  .map((row) => row.join(","))
  .join("\n");

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

describe("Home", () => {
  beforeAll(() => {
    if (!window.URL.createObjectURL) {
      window.URL.createObjectURL = jest.fn(() => "mocked-url");
    }

    global.fetch = jest.fn(() =>
      Promise.resolve({
        blob: () =>
          Promise.resolve(new Blob([csvContent], { type: "text/csv" })),
      })
    );
  });
  it("renders", () => {
    render(
      <BrowserRouter>
        <ThemeContext.Provider value={mockTheme}>
          <Home />
        </ThemeContext.Provider>
      </BrowserRouter>
    );

    expect(
      screen.getByText(/upload your signal csv file/i)
    ).toBeInTheDocument();
  });

  it("renders and populates select after drop", async () => {
    render(
      <BrowserRouter>
        <ThemeContext.Provider value={mockTheme}>
          <Home />
        </ThemeContext.Provider>
      </BrowserRouter>
    );

    const paragraph = screen.getByText(/Upload your signal CSV file/i);
    const dropzone = paragraph.parentElement;

    const csvFile = new File([csvContent], "EDA.csv", { type: "text/csv" });
    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [csvFile],
      },
    });
    const timestampSelect = screen.getByLabelText(/Timestamp Column/i);
    const signalValuesSelect = screen.getByLabelText(/Signal Values/i);
    await waitFor(() => {
      expect(timestampSelect.options.length).toBeGreaterThan(0);
      expect(signalValuesSelect.options.length).toBeGreaterThan(0);
    });

    fireEvent.change(timestampSelect, { target: { value: "0" } });
    fireEvent.change(signalValuesSelect, { target: { value: "1" } });

    expect(
      await screen.findByText(/Detected sampling rate of 1(\.0)? Hz/i)
    ).toBeInTheDocument();
  });

  it("renders and populates select with no headers", async () => {
    render(
      <BrowserRouter>
        <ThemeContext.Provider value={mockTheme}>
          <Home />
        </ThemeContext.Provider>
      </BrowserRouter>
    );

    const paragraph = screen.getByText(/Upload your signal CSV file/i);
    const dropzone = paragraph.parentElement;

    const csvFile = new File([csvContentNoHeader], "EDA.csv", {
      type: "text/csv",
    });
    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [csvFile],
      },
    });
    const timestampSelect = screen.getByLabelText(/Timestamp Column/i);
    const signalValuesSelect = screen.getByLabelText(/Signal Values/i);
    await waitFor(() => {
      expect(timestampSelect.options.length).toBeGreaterThan(0);
      expect(signalValuesSelect.options.length).toBeGreaterThan(0);
    });

    const expectedHeaders = ["Column 1", "Column 2", "No timestamps"];

    const optionsText = Array.from(timestampSelect.options).map(
      (option) => option.text
    );

    expectedHeaders.forEach((header) => {
      expect(optionsText).toContain(header);
    });
  });

  it("renders and populates select via loadSampleFile button", async () => {
    render(
      <BrowserRouter>
        <ThemeContext.Provider value={mockTheme}>
          <Home />
        </ThemeContext.Provider>
      </BrowserRouter>
    );

    const sampleButton = screen.getByRole("button", { name: /EDA.csv/i });
    fireEvent.click(sampleButton);

    const timestampSelect = screen.getByLabelText(/Timestamp Column/i);
    const signalValuesSelect = screen.getByLabelText(/Signal Values/i);
    await waitFor(() => {
      expect(timestampSelect.options.length).toBeGreaterThan(0);
      expect(signalValuesSelect.options.length).toBeGreaterThan(0);
    });

    const expectedHeaders = ["Timestamp", "Gsr", "No timestamps"];

    const optionsText = Array.from(timestampSelect.options).map(
      (option) => option.text
    );

    expectedHeaders.forEach((header) => {
      expect(optionsText).toContain(header);
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/Signal Type/i)).toHaveValue("EDA");
      expect(screen.getByLabelText(/Timestamp Column/i)).toHaveValue("0");
      expect(screen.getByLabelText(/Signal Values/i)).toHaveValue("1");
    });
  });

  it("handles wrong values in sampling rate input", async () => {
    const spyParseInt = jest.spyOn(global, "parseInt");
    render(
      <BrowserRouter>
        <ThemeContext.Provider value={mockTheme}>
          <Home />
        </ThemeContext.Provider>
      </BrowserRouter>
    );

    const dropzone = screen.getByText(
      /Upload your signal CSV file/i
    ).parentElement;

    const csvFile = new File([csvContent], "EDA.csv", { type: "text/csv" });

    fireEvent.drop(dropzone, {
      dataTransfer: { files: [csvFile] },
    });

    await waitFor(() => {
      const timestampSelect = document.getElementById("timestampColumn");
      if (!timestampSelect) throw new Error("Select not found");
      if (timestampSelect.options.length === 0)
        throw new Error("Options not loaded yet");
    });

    const samplingRateInput = screen.getByLabelText(/Sampling Rate \(Hz\)/i);
    const timestampSelect = screen.getByLabelText(/Timestamp Column/i);

    fireEvent.change(timestampSelect, { target: { value: "2" } }); // 2 = No timestamps

    await waitFor(() => {
      expect(samplingRateInput).not.toBeDisabled();
    });

    fireEvent.change(samplingRateInput, { target: { value: -1 } }); // Tries wrong value
    expect(spyParseInt).toHaveBeenCalledWith("-1");

    fireEvent.blur(samplingRateInput);
    expect(spyParseInt).toHaveBeenCalledWith(1); // onBlur event corrects value

    spyParseInt.mockRestore();
  });

  it("autoconfigures sample data so next-step buttons become available", async () => {
    render(
      <BrowserRouter>
        <ThemeContext.Provider value={mockTheme}>
          <Home />
        </ThemeContext.Provider>
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /EDA.csv/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/Signal Type/i)).toHaveValue("EDA");
      expect(screen.getByLabelText(/Timestamp Column/i)).toHaveValue("0");
      expect(screen.getByLabelText(/Signal Values/i)).toHaveValue("1");
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Resampling/i })
      ).not.toBeDisabled();
      expect(screen.getByRole("button", { name: /Filtering/i })).not.toBeDisabled();
      expect(screen.getByRole("button", { name: /Processing/i })).not.toBeDisabled();
    });
  });

  it("navigates to resampling from next step when all params are ready", async () => {
    render(
      <BrowserRouter>
        <ThemeContext.Provider value={mockTheme}>
          <Home />
        </ThemeContext.Provider>
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /EDA.csv/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/Signal Type/i)).toHaveValue("EDA");
      expect(screen.getByLabelText(/Timestamp Column/i)).toHaveValue("0");
      expect(screen.getByLabelText(/Signal Values/i)).toHaveValue("1");
    });

    const resamplingButton = screen.getByRole("button", {
      name: /Resampling/i,
    });

    await waitFor(() => {
      expect(resamplingButton).not.toBeDisabled();
    });

    fireEvent.click(resamplingButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringMatching(/resampling/),
        {
          state: expect.objectContaining({
            signalType: "EDA",
            timestampColumn: 0,
            samplingRate: 1,
            signalValues: 1,
          }),
        }
      );
    });
  });
});
