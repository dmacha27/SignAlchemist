import { render as testingLibraryRender } from "@testing-library/react";

export function render(ui) {
  return testingLibraryRender(<>{ui}</>);
}
