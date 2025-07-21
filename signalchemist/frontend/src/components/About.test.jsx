import { render, screen, fireEvent } from "../test-utils";
import About from "./About";
import { ThemeContext } from "../contexts/ThemeContext";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

const mockTheme = {
  isDarkMode: false,
  toggleDarkMode: jest.fn(),
};

describe("About", () => {
  it("renders", () => {
    render(
      <ThemeContext.Provider value={mockTheme}>
        <About />
      </ThemeContext.Provider>
    );

    expect(screen.getByText(/about this project/i)).toBeInTheDocument();
  });

  it("navigates to home when button is clicked", () => {
    render(
      <ThemeContext.Provider value={mockTheme}>
        <About />
      </ThemeContext.Provider>
    );

    const button = screen.getByRole("button", { name: /Try it out/i });
    fireEvent.click(button);

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});
