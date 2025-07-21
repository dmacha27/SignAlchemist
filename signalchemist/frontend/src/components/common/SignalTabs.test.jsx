import { render, screen } from "../../test-utils";
import SignalTabs from "./SignalTabs";
import { FaRobot } from "react-icons/fa";
import { ThemeContext } from "../../contexts/ThemeContext";

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
    expect(screen.getByText("Charts")).toBeInTheDocument();
    expect(screen.getByText("Spectrum")).toBeInTheDocument();

    expect(screen.getAllByText("Original Signal")).toHaveLength(2);
    expect(screen.getAllByText("Processed Signal")).toHaveLength(2);

    // These componentes are tested individually
    expect(screen.getAllByText("CustomChart")).toHaveLength(2);
    expect(screen.getAllByText("SpectrumChart")).toHaveLength(2);
    expect(screen.getAllByText("ComparisonChart")).toHaveLength(1);
    expect(screen.getAllByText("ComparisonSpectrumChart")).toHaveLength(1);
  });

  it("renders loader when isRequesting is true", () => {
    render(<SignalTabs {...baseProps} isRequesting={true} />);
    expect(screen.getAllByText("Processing request...")).toHaveLength(4);
  });

  it("renders loader message when chartDataOriginal is missing", () => {
    render(
      <SignalTabs
        {...baseProps}
        chartDataOriginal={null}
        isRequesting={false}
      />
    );
    expect(screen.getAllByText("Waiting for request...")).toHaveLength(2);
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
      screen.getAllByText("Please run processing to see results.")
    ).toHaveLength(4);
  });
});
