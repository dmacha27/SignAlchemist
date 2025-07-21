import { Stepper, Popover, Text } from "@mantine/core";
import PropTypes from "prop-types";

/**
 * Renders a step-by-step pipeline view.
 *
 * @param {Array} nodes - Array of node objects with id, type, and data.
 */
const PipelineSteps = ({ nodes }) => {
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return <Text>No steps to display.</Text>;
  }

  const dictNodes = {};
  nodes.forEach((element) => {
    if (element?.id) {
      dictNodes[element.id] = element;
    }
  });

  const conectedNodes = [];
  const visited = new Set();
  let actualNode = "1";

  while (actualNode && !visited.has(actualNode)) {
    const current = dictNodes[actualNode];
    if (!current) break;

    conectedNodes.push(current);
    visited.add(actualNode);
    actualNode = current.data?.target;
  }

  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  return (
    <Stepper iconSize={42}>
      {conectedNodes.map((node) => {
        if (!node.data.technique)
          return (
            <Stepper.Step
              key={node.id}
              label={capitalize(node.type)}
              description=""
            />
          );

        const techniqueObj = JSON.parse(node.data.technique);

        return (
          <Stepper.Step
            key={node.id}
            label={capitalize(node.type)}
            description={
              node.type !== "InputSignal" &&
              node.type !== "OutputSignal" && (
                <div className="bg-white dark:bg-gray-900 border-0 dark:border dark:border-gray-600 shadow-md rounded-lg p-4">
                  <div>
                    <strong>Technique:</strong> {capitalize(techniqueObj.name)}
                  </div>
                  <div>
                    <ul className="mt-2">
                      {techniqueObj.fields &&
                        Object.entries(techniqueObj.fields).map(
                          ([key, value]) => {
                            const capitalizedKey = capitalize(key);
                            const valueStr = String(value);
                            const isLong = valueStr.length > 30;

                            return (
                              <li key={key} className="mb-1">
                                <strong>{capitalizedKey}: </strong>
                                {isLong ? (
                                  <Popover
                                    width={300}
                                    trapFocus
                                    position="bottom"
                                    withArrow
                                    shadow="md"
                                  >
                                    <Popover.Target>
                                      <Text title="Click to view full text">
                                        Click
                                      </Text>
                                    </Popover.Target>
                                    <Popover.Dropdown>
                                      <Text size="sm" className="break-words">
                                        {valueStr}
                                      </Text>
                                    </Popover.Dropdown>
                                  </Popover>
                                ) : (
                                  <span>{valueStr}</span>
                                )}
                              </li>
                            );
                          }
                        )}
                    </ul>
                  </div>
                </div>
              )
            }
          />
        );
      })}
    </Stepper>
  );
};

PipelineSteps.propTypes = {
  nodes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      data: PropTypes.object,
    })
  ).isRequired,
};

export default PipelineSteps;
