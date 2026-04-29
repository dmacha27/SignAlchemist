import { render, screen, waitFor, fireEvent } from "../test-utils";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Filtering from "./Filtering";
import { ThemeContext } from "../contexts/ThemeContext";

jest.mock("./common/SignalTabs", () => () => <div>SignalTabs</div>);

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

const createSuccessFetchMock = () =>
  jest.fn((url) => {
    if (url.includes("metrics")) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            metricA: { value: 0.967534, description: "Gadea et al." },
          }),
      });
    }
    if (url.includes("/api/filtering")) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [
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

    return Promise.reject(new Error(`Unhandled fetch URL: ${url}`));
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
const csvContent = mockEDA.map((row) => row.join(",")).join("\n");

const initialEntry = {
  pathname: "/filtering",
  state: {
    file: new File([csvContent], "mock.csv", { type: "text/csv" }),
    signalType: "EDA",
    timestampColumn: 0,
    samplingRate: 1,
    signalValues: 1,
  },
};

describe("Filtering", () => {
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

  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    global.fetch = createSuccessFetchMock();
  });

  it("renders", async () => {
    render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <ThemeContext.Provider value={mockTheme}>
          <Routes>
            <Route path="/filtering" element={<Filtering />} />
          </Routes>
        </ThemeContext.Provider>
      </MemoryRouter>
    );

    expect(screen.getByText(/Filtering controls/i)).toBeInTheDocument();

    await waitFor(() => {
      // Jest will wait until all the initial requests have been completed
      const elements = screen.queryAllByText("Waiting for request...");
      expect(elements.length).toBe(0);
    });

    await screen.findByText(/metricA/i);

    expect(await screen.findByText(/metricA/i)).toBeInTheDocument();
  });

  it("updates filter and fields when filter changes", async () => {
    render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <ThemeContext.Provider value={mockTheme}>
          <Routes>
            <Route path="/filtering" element={<Filtering />} />
          </Routes>
        </ThemeContext.Provider>
      </MemoryRouter>
    );

    await waitFor(() => {
      // Jest will wait until all the initial requests have been completed
      const elements = screen.queryAllByText("Waiting for request...");
      expect(elements.length).toBe(0);
    });

    await fireEvent.click(screen.getByTestId("Select filter"));

    await fireEvent.click((await screen.findByText(/Fir/i)).parentElement);
    expect(screen.getByTestId("Select filter")).toHaveValue("FIR");

    await waitFor(() => {
      // Fir does not have order parameter
      expect(screen.queryByLabelText(/Order/i)).not.toBeInTheDocument();
    });
  });

  it("updates the filter field when input changes", async () => {
    render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <ThemeContext.Provider value={mockTheme}>
          <Routes>
            <Route path="/filtering" element={<Filtering />} />
          </Routes>
        </ThemeContext.Provider>
      </MemoryRouter>
    );

    await waitFor(() => {
      const elements = screen.queryAllByText("Waiting for request...");
      expect(elements.length).toBe(0);
    });

    await screen.findByText(/metricA/i);

    const orderInput = screen.getByPlaceholderText("Enter order");

    fireEvent.change(orderInput, { target: { value: "4" } });

    expect(orderInput.value).toBe("4");
  });

  it("executes requestFilter and calls both fetch", async () => {
    render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <ThemeContext.Provider value={mockTheme}>
          <Routes>
            <Route path="/filtering" element={<Filtering />} />
          </Routes>
        </ThemeContext.Provider>
      </MemoryRouter>
    );

    await waitFor(() => {
      // Jest will wait until all the initial requests have been completed
      const elements = screen.queryAllByText("Waiting for request...");
      expect(elements.length).toBe(0);
    });

    const button = screen.getByRole("button", { name: /execute filter/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.queryByText(/Processing request/i)).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getAllByText("55.55").length).toBeGreaterThan(0);
    });
  });

  it("shows error if filtering returns error", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    global.fetch = jest.fn((url) => {
      if (url.includes("/api/filtering")) {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: "Filtering failed" }),
        });
      }

      if (url.includes("/api/metrics")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              metricA: { value: 0.967534, description: "Gadea et al." },
            }),
        });
      }

      return Promise.reject(new Error(`Unhandled fetch URL: ${url}`));
    });

    render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <ThemeContext.Provider value={mockTheme}>
          <Routes>
            <Route path="/filtering" element={<Filtering />} />
          </Routes>
        </ThemeContext.Provider>
      </MemoryRouter>
    );

    await waitFor(() => {
      // Jest will wait until all the initial requests have been completed
      const elements = screen.queryAllByText("Waiting for request...");
      expect(elements.length).toBe(0);
    });

    const button = screen.getByRole("button", { name: /execute filter/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.queryByText(/Processing request/i)).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        consoleErrorSpy.mock.calls.some((call) =>
          call.some((entry) => String(entry).includes("Filtering failed"))
        )
      ).toBe(true);
    });

    consoleErrorSpy.mockRestore();
  });

  it("shows error if metrics returns error", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    let metricsCallCount = 0;

    global.fetch = jest.fn((url) => {
      if (url.includes("/api/filtering")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: [
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

      if (url.includes("/api/metrics")) {
        metricsCallCount += 1;
        return Promise.resolve({
          ok: metricsCallCount === 1,
          json: () =>
            Promise.resolve(
              metricsCallCount === 1
                ? { metricA: { value: 0.967534, description: "Gadea et al." } }
                : { error: "Metrics failed" }
            ),
        });
      }

      return Promise.reject(new Error(`Unhandled fetch URL: ${url}`));
    });

    render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <ThemeContext.Provider value={mockTheme}>
          <Routes>
            <Route path="/filtering" element={<Filtering />} />
          </Routes>
        </ThemeContext.Provider>
      </MemoryRouter>
    );

    await waitFor(() => {
      const elements = screen.queryAllByText("Waiting for request...");
      expect(elements.length).toBe(0);
    });

    await screen.findByText(/metricA/i);

    const button = screen.getByRole("button", { name: /execute filter/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.queryByText(/Processing request/i)).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        consoleErrorSpy.mock.calls.some((call) =>
          call.some((entry) => String(entry).includes("Metrics failed"))
        )
      ).toBe(true);
    });

    consoleErrorSpy.mockRestore();
  });
});
