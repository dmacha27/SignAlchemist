import { render, screen, fireEvent } from "../../test-utils";
import InfoTable from "./InfoTable";

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

const mock4hz = [
  ["Timestamp", "Gsr"],
  [0, 1.1],
  [0.25, 1.5],
  [0.5, 2.2],
  [0.75, 2.5],
  [1, 3.3],
];

describe("InfoTable", () => {
  // Data OK (Headers and rows)
  it("renders data properly", () => {
    render(<InfoTable table={mockEDA} onlyTable={false} />);
    expect(screen.getByText("#")).toBeInTheDocument();
    expect(screen.getByText("Timestamp")).toBeInTheDocument();
    expect(screen.getByText("Gsr")).toBeInTheDocument();

    for (let i = 1; i < 5; i++) {
      expect(screen.getByRole("cell", { name: i })).toBeInTheDocument(); // Row index
      expect(
        screen.getByRole("cell", { name: mockEDA[i][0].toFixed(4) })
      ).toBeInTheDocument(); // Timestamp
      expect(
        screen.getByRole("cell", { name: mockEDA[i][1].toFixed(4) })
      ).toBeInTheDocument(); // Gsr
    }
  });

  // Metrics OK
  it("calculates and renders (format) statistics properly", () => {
    render(<InfoTable table={mock4hz} onlyTable={false} />);

    expect(screen.getByText("Duration:")).toBeInTheDocument();
    expect(screen.getByText("Sampling rate:")).toBeInTheDocument();
    expect(screen.getByText("Signal length:")).toBeInTheDocument();

    expect(screen.getByText("0 min 1 s")).toBeInTheDocument();
    expect(screen.getByText("4.0 Hz")).toBeInTheDocument();
    expect(screen.getByText("5 samples")).toBeInTheDocument();
  });

  // Showing metrics only when onlyTable is false
  test("renders only table when onlyTable is true", () => {
    render(<InfoTable table={mockEDA} onlyTable={true} />);

    // Test whether not in the document: https://github.com/tom-sherman/jest-dom-nottobeindocument-bug/commit/eca61346d83bec2a1d0212b916bc9a8852dcf6e9
    expect(() => screen.getByText("Duration:")).toThrow();
    expect(() => screen.getByText("Sampling rate:")).toThrow();
    expect(() => screen.getByText("Signal length:")).toThrow();
  });

  // Pagination (check first and second page)
  test("pagination works correctly", () => {
    render(<InfoTable table={mockEDA} onlyTable={false} />);

    // Check first page data
    expect(screen.getByText("1.0000")).toBeInTheDocument();
    expect(() => screen.getByText("6.0000")).toThrow();

    // Go to page 2
    const page2 = screen.getByRole("button", { name: "2" });
    fireEvent.click(page2);

    expect(screen.getByText("6.0000")).toBeInTheDocument();
    expect(() => screen.getByText("1.0000")).toThrow();
  });
});
