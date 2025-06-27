import { render, screen, waitFor, fireEvent } from "../test-utils";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Resampling from "./Resampling";
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

const initialEntry = {
  pathname: "/resampling",
  state: {
    file: new File([csvContent], "mock.csv", { type: "text/csv" }),
    signalType: "EDA",
    timestampColumn: 0,
    samplingRate: 1,
    signalValues: 1,
  },
};

describe("Resampling", () => {
  beforeAll(() => {
    if (!window.URL.createObjectURL) {
      window.URL.createObjectURL = jest.fn(() => "mocked-url");
    }

    window.addEventListener("error", (event) => {
      const message = event?.error?.message || event.message || "";

      if (message.includes("scrollIntoView is not a function")) {
        event.preventDefault(); // Mantine core scrolls when option is selected but it does not work in tests
      }
    });

    global.fetch = jest.fn((url) => {
      if (url.includes("/api/resampling")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: [
                // No headers
                [0, 55.55],
                [1, 1.5],
                [2, 2.2],
                [3, 2.5],
                [4, 3.3],
                [5, 3.5],
                [6, 4.4],
              ],
            }),
        });
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders", async () => {
    render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <ThemeContext.Provider value={mockTheme}>
          <Routes>
            <Route path="/resampling" element={<Resampling />} />
          </Routes>
        </ThemeContext.Provider>
      </MemoryRouter>
    );

    expect(screen.getByText(/Resampling controls/i)).toBeInTheDocument();

    await waitFor(() => {
      // Jest will wait until all the initial requests have been completed
      const elements = screen.queryAllByText("Waiting for request...");
      expect(elements.length).toBe(0);
    });
  });

  it("handles wrong values in sampling rate input", async () => {
    render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <ThemeContext.Provider value={mockTheme}>
          <Routes>
            <Route path="/resampling" element={<Resampling />} />
          </Routes>
        </ThemeContext.Provider>
      </MemoryRouter>
    );

    await waitFor(() => {
      // Jest will wait until all the initial requests have been completed
      const elements = screen.queryAllByText("Waiting for request...");
      expect(elements.length).toBe(0);
    });

    const samplingRateInput = screen.getByLabelText(
      /New sampling Rate \(Hz\)/i
    );

    fireEvent.change(samplingRateInput, { target: { value: -1 } }); // Tries wrong value

    fireEvent.blur(samplingRateInput);
    expect(samplingRateInput).toHaveValue(1); // onBlur event corrects value
  });

  it("executes requestFilter and calls fetch", async () => {
    render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <ThemeContext.Provider value={mockTheme}>
          <Routes>
            <Route path="/resampling" element={<Resampling />} />
          </Routes>
        </ThemeContext.Provider>
      </MemoryRouter>
    );

    await waitFor(() => {
      // Jest will wait until all the initial requests have been completed
      const elements = screen.queryAllByText("Waiting for request...");
      expect(elements.length).toBe(0);
    });

    const select = screen.getByRole("combobox", {
      name: /Interpolation technique/i,
    });
    fireEvent.change(select, { target: { value: "1d" } });
    expect(select).toHaveValue("1d");

    const button = screen.getByRole("button", { name: /Resample/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.queryByText(/Processing request/i)).not.toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);

    const lastCall = global.fetch.mock.calls[0];
    const fetchOptions = lastCall[1];
    const body = fetchOptions.body;

    expect(body.get("interpolation_technique")).toBe("1d");
    expect(body.get("target_sampling_rate")).toBe("1");
  });

  it("shows error toast if filtering returns error", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: "Filtering failed" }),
      })
    );

    render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <ThemeContext.Provider value={mockTheme}>
          <Routes>
            <Route path="/resampling" element={<Resampling />} />
          </Routes>
        </ThemeContext.Provider>
      </MemoryRouter>
    );

    await waitFor(() => {
      // Jest will wait until all the initial requests have been completed
      const elements = screen.queryAllByText("Waiting for request...");
      expect(elements.length).toBe(0);
    });

    const button = screen.getByRole("button", { name: /Resample/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.queryByText(/Processing request/i)).not.toBeInTheDocument();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith("Filtering failed");

    consoleErrorSpy.mockRestore();
  });
});
