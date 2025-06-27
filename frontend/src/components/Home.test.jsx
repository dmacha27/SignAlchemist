import { render, screen, fireEvent, waitFor } from "../test-utils";
import { BrowserRouter } from "react-router-dom";
import Home from "./Home";
import { ThemeContext } from "../contexts/ThemeContext";

const mockChartRef = {
  config: { options: {} },
  update: jest.fn(),
  data: {},
};

jest.mock("react-chartjs-2", () => {
  const Line = jest.fn(({ data, options, ref }) => {
    mockChartRef.config.options = {
      ...options,
      label: "signal",
    };
    mockChartRef.data = data;
    ref.current = mockChartRef;

    return <div data-testid="mock-line-chart" />;
  });

  return { Line };
});

const mockInstances = { mockChart: mockChartRef };

jest.mock("chart.js", () => {
  return {
    Chart: class {
      static register = jest.fn();
      static get instances() {
        return mockInstances;
      }
    },
  };
});

jest.mock("chartjs-plugin-zoom", () => ({}));
jest.mock("chartjs-adapter-date-fns", () => {});
jest.mock("react-draggable", () => ({ children }) => <div>{children}</div>);

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
      await screen.findByText(/Detected sampling rate of 1.0 Hz/i)
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

  it("shows error when opening utility modal without selecting all params", async () => {
    render(
      <BrowserRouter>
        <ThemeContext.Provider value={mockTheme}>
          <Home />
        </ThemeContext.Provider>
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /EDA.csv/i }));
    await waitFor(() => {
      const timestampSelect = document.getElementById("timestampColumn");
      if (!timestampSelect) throw new Error("Select not found");
      if (timestampSelect.options.length === 0)
        throw new Error("Options not loaded yet");
    });

    const uploadBtn = screen.getByText(/Select utility/i).parentElement;
    fireEvent.click(uploadBtn);

    expect(
      await screen.findByText(/All fields must be selected/i)
    ).toBeInTheDocument();
  });

  it("shows utility modal and navigates to resampling", async () => {
    render(
      <BrowserRouter>
        <ThemeContext.Provider value={mockTheme}>
          <Home />
        </ThemeContext.Provider>
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /EDA.csv/i }));
    await waitFor(() => {
      const timestampSelect = document.getElementById("timestampColumn");
      if (!timestampSelect) throw new Error("Select not found");
      if (timestampSelect.options.length === 0)
        throw new Error("Options not loaded yet");
    });

    const timestampSelect = screen.getByLabelText(/Timestamp Column/i);
    const signalValuesSelect = screen.getByLabelText(/Signal Values/i);
    const signalType = screen.getByLabelText(/Signal Type/i);

    fireEvent.change(timestampSelect, { target: { value: 0 } });
    fireEvent.change(signalValuesSelect, { target: { value: 1 } });
    fireEvent.change(signalType, { target: { value: "EDA" } });

    const openModalButton = screen.getByText(/Select utility/i).parentElement;

    await waitFor(() => {
      expect(openModalButton).not.toBeDisabled();
    });

    fireEvent.click(openModalButton);

    expect(
      await screen.findByText(/Select SignAlchemist Utility/i)
    ).toBeInTheDocument();

    const goButton = screen.getAllByRole("button", { name: /Go/i })[0];
    fireEvent.click(goButton);

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
