import { render, screen } from "../../test-utils";
import SignalTabs from "./SignalTabs";
import { FaRobot } from "react-icons/fa";
import { ThemeContext } from "../../contexts/ThemeContext";
import userEvent from "@testing-library/user-event";

// https://stackoverflow.com/a/47058957
// These componentes are tested individually
jest.mock("./CustomChart", () => () => <div>CustomChart</div>);
jest.mock("./SpectrumChart", () => () => <div>SpectrumChart</div>);
jest.mock("./ComparisonChart", () => () => <div>ComparisonChart</div>);
jest.mock("./ComparisonSpectrumChart", () => () => (
  <div>ComparisonSpectrumChart</div>
));
jest.mock("./LoaderMessage", () => ({ message }) => <div>{message}</div>);

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

const baseProps = {
  rightTitle: "Processed",
  rightIcon: <FaRobot />,
  chartDataOriginal: mockEDA,
  chartDataProcessed: mockEDA,
  samplingRate: 5,
};

const mockTheme = {
  isDarkMode: false,
  toggleDarkMode: jest.fn(),
};

describe("SignalTabs", () => {
  it("renders normally", () => {
    render(
      <ThemeContext.Provider value={mockTheme}>
        <SignalTabs {...baseProps}/>
      </ThemeContext.Provider>
    );
    expect(screen.getByText("Signal")).toBeInTheDocument();
    expect(screen.getByText("Spectrum")).toBeInTheDocument();
    expect(screen.getByText("Side by side")).toBeInTheDocument();
    expect(screen.getByText("Compare")).toBeInTheDocument();

    // These componentes are tested individually
    expect(screen.getAllByText("CustomChart")).toHaveLength(2);
    expect(screen.queryByText("SpectrumChart")).not.toBeInTheDocument();
    expect(screen.queryByText("ComparisonChart")).not.toBeInTheDocument();
    expect(screen.queryByText("ComparisonSpectrumChart")).not.toBeInTheDocument();
  });

  it("renders loader when isRequesting is true", () => {
    render(<SignalTabs {...baseProps} isRequesting={true} />);
    expect(screen.getByText("Processing request...")).toBeInTheDocument();
  });

  it("renders loader message when chartDataOriginal is missing", () => {
    render(
      <SignalTabs
        {...baseProps}
        chartDataOriginal={null}
        isRequesting={false}
      />
    );
    expect(screen.getByText("Waiting for request...")).toBeInTheDocument();
  });

  it("renders request message when chartDataProcessed is missing", () => {
    render(
      <SignalTabs
        {...baseProps}
        chartDataProcessed={null}
        isRequesting={false}
      />
    );
    expect(
      screen.queryByText("Please run processing to see results.")
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Please run processing to see processed results.")
    ).toBeInTheDocument();
  });

  it("switches to spectrum and compare views", async () => {
    const user = userEvent.setup();

    render(<SignalTabs {...baseProps} />);

    await user.click(screen.getByRole("button", { name: /Spectrum/i }));
    expect(screen.getAllByText("SpectrumChart")).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: /Compare/i }));
    expect(screen.getByText("ComparisonSpectrumChart")).toBeInTheDocument();
  });
});
