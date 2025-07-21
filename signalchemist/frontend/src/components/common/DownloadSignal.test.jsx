import { render, screen, fireEvent } from "../../test-utils";
import DownloadSignal from "./DownloadSignal";

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

describe("DownloadSignal", () => {
  test("detects single character string", () => {
    render(<DownloadSignal table={mockEDA} name="test" />);
    const input = screen.getByRole("textbox");

    // Docs: https://testing-library.com/docs/example-input-event/
    fireEvent.change(input, { target: { value: "" } });

    expect(
      screen.getByText("The separator must be a single character")
    ).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "LONG" } });

    expect(
      screen.getByText("The separator must be a single character")
    ).toBeInTheDocument();
  });

  test("detects dot separator", () => {
    render(<DownloadSignal table={mockEDA} name="test" />);
    const input = screen.getByRole("textbox");

    fireEvent.change(input, { target: { value: "." } });

    expect(
      screen.getByText('The separator cannot be a dot (".")')
    ).toBeInTheDocument();
  });

  test("detects number separator", () => {
    render(<DownloadSignal table={mockEDA} name="test" />);
    const input = screen.getByRole("textbox");

    fireEvent.change(input, { target: { value: "3" } });

    expect(
      screen.getByText("The separator cannot be a number")
    ).toBeInTheDocument();
  });

  test("detects correct separator", () => {
    render(<DownloadSignal table={mockEDA} name="test" />);
    const input = screen.getByRole("textbox");

    fireEvent.change(input, { target: { value: ";" } });
    expect(() => screen.getByText(/The separator/)).toThrow();
  });

  test("Button should not be disabled when trying to download on error status", () => {
    render(<DownloadSignal table={mockEDA} name="test" />);

    // Force error
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "" } });

    const button = screen.getByRole("button", { name: /download/i });
    expect(button).toBeDisabled();
  });

  test("creates a correct Blob with expected content", async () => {
    const originalBlob = global.Blob;
    let capturedContent = null;

    global.Blob = function (content, options) {
      capturedContent = content[0];
      return new originalBlob(content, options);
    };

    const mockCreateObjectURL = jest.fn(() => "blob:fake-url");
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = jest.fn();

    render(<DownloadSignal table={mockEDA} name="test" />);

    const button = screen.getByRole("button", { name: /download/i });
    fireEvent.click(button);

    expect(mockCreateObjectURL).toHaveBeenCalled();

    const expectedContent = mockEDA.map((row) => row.join(",")).join("\n");

    expect(capturedContent).toEqual(expectedContent);

    global.Blob = originalBlob;
  });

  test("generates only signal data without header", () => {
    const originalBlob = global.Blob;
    let capturedContent = null;

    global.Blob = function (content, options) {
      capturedContent = content[0];
      return new originalBlob(content, options);
    };

    const mockCreateObjectURL = jest.fn(() => "blob:fake-url");
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = jest.fn();

    render(<DownloadSignal table={mockEDA} name="test" />);

    // Tests both only signal include header selects
    // Docs: https://testing-library.com/docs/queries/bylabeltext/ This returns the checkbox associated with
    fireEvent.click(screen.getByLabelText(/Only signal/i));
    fireEvent.click(screen.getByLabelText(/Include header/i));

    const button = screen.getByRole("button", { name: /download/i });
    fireEvent.click(button);

    const expectedContent = mockEDA
      .slice(1)
      .map((row) => row[1])
      .join("\n");

    expect(capturedContent).toEqual(expectedContent);

    global.Blob = originalBlob;
  });

  test("generates .txt file with correct filename", () => {
    let capturedAnchor = null;
    const originalCreateElement = document.createElement;

    jest.spyOn(document, "createElement").mockImplementation((tag) => {
      const el = originalCreateElement.call(document, tag);
      if (tag === "a") {
        capturedAnchor = el;
      }
      return el;
    });

    render(<DownloadSignal table={mockEDA} name="myfile" />);

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "txt" },
    });

    fireEvent.click(screen.getByRole("button", { name: /download/i }));

    expect(capturedAnchor.download).toBe("myfile_signal.txt");
    document.createElement.mockRestore();
  });
});
