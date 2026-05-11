/* global jest, describe, beforeAll, it, expect */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

jest.mock("react-hot-toast", () => ({
  Toaster: () => null,
  toast: { error: jest.fn() },
}));

import { toast } from "react-hot-toast";

describe("App", () => {
  beforeAll(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: () => ({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }),
    });
  });

  it("renders", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );
  });

  it("toggles dark mode on button click", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );

    expect(document.body).toHaveClass("bg-white");
    expect(document.body).not.toHaveClass("bg-gray-900");

    const toggleBtn = screen.getByRole("button", { name: /switch to dark mode/i });
    fireEvent.click(toggleBtn);

    await waitFor(() => expect(document.body).toHaveClass("bg-gray-900"));

    expect(document.body).not.toHaveClass("bg-white");
  });

  it("redirects home on protected route", async () => {
    render(
      <MemoryRouter initialEntries={["/processing"]}>
        <App />
      </MemoryRouter>
    );

    expect(
      screen.getByText(/upload your signal csv file/i)
    ).toBeInTheDocument();
  });

  it("redirects subpage with state", async () => {
    render(
      <MemoryRouter
        initialEntries={[{ pathname: "/processing", state: { yes: "yes" } }]}
      >
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText(/signal processing/i)).toBeInTheDocument();
  });

  it("navigation menu error", async () => {
    render(
      <MemoryRouter initialEntries={["/try"]}>
        <App />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByLabelText(/open navigation menu/i));
    const button = screen.getByTestId("home");
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(toast.error).toHaveBeenCalledWith("No data detected");
  });

  it("navigation menu redirects", async () => {
    render(
      <MemoryRouter
        initialEntries={[{ pathname: "/processing", state: { yes: "yes" } }]}
      >
        <App />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByLabelText(/open navigation menu/i));
    const button = screen.getByTestId("home");
    expect(button).toBeInTheDocument();
    fireEvent.click(button);

    expect(
      screen.getByText(/upload your signal csv file/i)
    ).toBeInTheDocument();
  });
});
