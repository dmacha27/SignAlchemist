import { render, screen } from "@testing-library/react";
import ErrorBoundary from "./ErrorBoundary";

const BadChartChild = () => {
  throw new Error("I am not drawing!");
};

describe("ErrorBoundary", () => {
  test("renders children without error", () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">Hello world</div>
      </ErrorBoundary>
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  test("renders message instead of child when the later throws error", () => {
    render(
      <ErrorBoundary>
        <BadChartChild />
      </ErrorBoundary>
    );
    expect(screen.getByText(/Check parameters/i)).toBeInTheDocument();
  });
});
