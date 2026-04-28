import { render, screen, fireEvent } from "../test-utils";
import { MemoryRouter } from "react-router-dom";
import About from "./About";
import { ThemeContext } from "../contexts/ThemeContext";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

const mockTheme = {
  isDarkMode: false,
  toggleDarkMode: jest.fn(),
};

describe("About", () => {
  it("renders", () => {
    render(
      <MemoryRouter>
        <ThemeContext.Provider value={mockTheme}>
          <About />
        </ThemeContext.Provider>
      </MemoryRouter>
    );

    expect(screen.getByText(/about this project/i)).toBeInTheDocument();
  });

  it("navigates to home when button is clicked", () => {
    render(
      <MemoryRouter>
        <ThemeContext.Provider value={mockTheme}>
          <About />
        </ThemeContext.Provider>
      </MemoryRouter>
    );

    const button = screen.getByRole("button", { name: /Try it now/i });
    fireEvent.click(button);

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});
