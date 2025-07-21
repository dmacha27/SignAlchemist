import { render, screen } from "../../test-utils";
import ExecutionIcon from "./ExecutionIcon";

describe("ExecutionIcon", () => {
  it("renders FaClock when executionState is 'waiting'", () => {
    render(<ExecutionIcon executionState="waiting" />);
    expect(screen.getByTestId("FaClock")).toBeInTheDocument();
  });

  it("renders FaSpinner when executionState is 'running'", () => {
    render(<ExecutionIcon executionState="running" />);
    expect(screen.getByTestId("FaSpinner")).toBeInTheDocument();
  });

  it("renders FaCheck when executionState is 'executed'", () => {
    render(<ExecutionIcon executionState="executed" />);
    expect(screen.getByTestId("FaCheck")).toBeInTheDocument();
  });

  it("renders FaExclamationCircle when executionState is 'error'", () => {
    render(<ExecutionIcon executionState="error" />);
    expect(screen.getByTestId("FaExclamationCircle")).toBeInTheDocument();
  });

  it("renders nothing when executionState is invalid", () => {
    const { container } = render(<ExecutionIcon executionState="invalid" />);
    const svgs = container.querySelectorAll("svg"); // Those react icons are always rendered as SVGs
    expect(svgs.length).toBe(0);
  });
});
