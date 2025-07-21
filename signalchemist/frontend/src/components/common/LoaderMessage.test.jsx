import { render, screen } from "../../test-utils";
import LoaderMessage from "./LoaderMessage";

describe("LoaderMessage", () => {
  it("renders message in loader", () => {
    render(<LoaderMessage message="I am your father" />);
    expect(screen.getByText("I am your father")).toBeInTheDocument();
  });
});
