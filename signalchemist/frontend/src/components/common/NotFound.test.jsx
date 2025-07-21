import { render, screen, fireEvent } from "../../test-utils";
import NotFound from "./NotFound";
import { ThemeContext } from "../../contexts/ThemeContext";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

const mockTheme = {
  isDarkMode: false,
  toggleDarkMode: jest.fn(),
};

describe("NotFound", () => {
  it("renders  404 message", () => {
    render(
      <ThemeContext.Provider value={mockTheme}>
        <NotFound />
      </ThemeContext.Provider>
    );
    expect(screen.getByText(/404 - Page not found/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Sorry, we couldn't find what you were looking for/i)
    ).toBeInTheDocument();
  });

  it("navigates to home when button is clicked", () => {
    render(
      <ThemeContext.Provider value={mockTheme}>
        <NotFound />
      </ThemeContext.Provider>
    );

    const button = screen.getByRole("button", { name: /home/i });
    fireEvent.click(button);

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});
