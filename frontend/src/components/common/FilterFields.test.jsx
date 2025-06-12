import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "../../test-utils";
import FilterFields from "./FilterFields";
import { ThemeContext } from "../../contexts/ThemeContext";

const mockFields = {
  order: 2,
  lowcut: null,
  highcut: null,
  python: { value: "" },
};

const mockTheme = {
  isDarkMode: false,
  toggleDarkMode: jest.fn(),
};

describe("FilterFields", () => {
  let onFieldChange;

  beforeEach(() => {
    onFieldChange = jest.fn();
  });

  it("renders all fields and info button", () => {
    render(
      <ThemeContext.Provider value={mockTheme}>
        <FilterFields fields={mockFields} onFieldChange={onFieldChange} />
      </ThemeContext.Provider>
    );

    expect(screen.getByLabelText(/Order/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Order/i)).toHaveValue("2"); // Default value

    expect(screen.getByLabelText(/Lowcut/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Lowcut/i)).toBeDisabled();
    expect(screen.getByLabelText(/Highcut/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Highcut/i)).toBeDisabled();

    // Info button for Python code
    expect(screen.getByRole("button", { name: /Info/i })).toBeInTheDocument();
  });

  it("calls onFieldChange on input changes", () => {
    render(
      <ThemeContext.Provider value={mockTheme}>
        <FilterFields fields={mockFields} onFieldChange={onFieldChange} />
      </ThemeContext.Provider>
    );

    const orderInput = screen.getByLabelText(/Order/i);

    fireEvent.change(orderInput, { target: { value: "3" } });

    fireEvent.blur(orderInput); // User loses focus on the input (onBlur event), should not call onFieldChange with other value but 3
    expect(onFieldChange).toHaveBeenCalledWith("order", 3);

    const textarea = screen.getByRole("textbox", { name: "" });
    fireEvent.change(textarea, {
      target: { value: "def my_function():\n\tpass" },
    });

    expect(onFieldChange).toHaveBeenCalledWith(
      "python",
      "def my_function():\n\tpass"
    );
  });

  it("calls onFieldChange on empty number input", () => {
    render(
      <ThemeContext.Provider value={mockTheme}>
        <FilterFields fields={mockFields} onFieldChange={onFieldChange} />
      </ThemeContext.Provider>
    );

    const orderInput = screen.getByLabelText(/Order/i);

    fireEvent.change(orderInput, { target: { value: "" } });

    expect(onFieldChange).toHaveBeenCalledWith("order", ""); // First it tries to set wrong value

    fireEvent.blur(orderInput); // User loses focus on the input
    expect(onFieldChange).toHaveBeenCalledWith("order", 1); // Empty input is forbidden, then force value of 1
  });

  it("toggles checkbox and enables/disables input", () => {
    render(
      <ThemeContext.Provider value={mockTheme}>
        <FilterFields fields={mockFields} onFieldChange={onFieldChange} />
      </ThemeContext.Provider>
    );

    const lowcutInput = screen.getByLabelText(/Lowcut/i);
    const lowcutCheckbox = screen.getAllByRole("checkbox")[0];
    expect(lowcutInput).toBeDisabled();

    fireEvent.click(lowcutCheckbox);
    expect(lowcutInput).not.toBeDisabled();
    expect(onFieldChange).toHaveBeenCalledWith("lowcut", 1);

    fireEvent.click(lowcutCheckbox);
    expect(lowcutInput).toBeDisabled();
    expect(onFieldChange).toHaveBeenCalledWith("lowcut", null);
  });

  it("copies code to clipboard and shows 'Copied!' icon in InfoModal", async () => {
    const writeText = jest.fn();

    Object.assign(navigator, {
      clipboard: {
        writeText,
      },
    });

    const content =
      "def filter_signal(signal): \n\tnew_values = scipy.ndimage.gaussian_filter1d(signal, sigma=30) \n\treturn new_values";

    render(
      <ThemeContext.Provider
        value={{
          isDarkMode: true,
          toggleDarkMode: jest.fn(),
        }}
      >
        <FilterFields fields={mockFields} onFieldChange={onFieldChange} />
      </ThemeContext.Provider>
    );

    fireEvent.click(screen.getByRole("button", { name: /Info/i }));
    const copyButton = await screen.findByTitle("Copy");

    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(content); // Clipboard filled
    expect(copyButton.firstChild).toHaveClass("text-green-500"); // SVG copied

    await waitFor(
      () => {
        expect(copyButton.firstChild).toHaveClass("text-gray-500");
      },
      { timeout: 3000 }
    );
  });
});
