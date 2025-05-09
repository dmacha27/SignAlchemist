import { memo } from 'react';
import PropTypes from 'prop-types';
import { Popover, Text } from '@mantine/core';

/**
 * InfoMetrics Component
 *
 * Renders a responsive grid of metric cards, each displaying a metric name and its formatted value.
 * On hover or click, a tooltip (Popover) is shown with additional details.
 *
 * @component
 * @param {Object} props
 * @param {Object.<string, { value: number, description: string }>} props.metrics
 * @returns {JSX.Element} A grid of metric cards with popover tooltips.
 */
const InfoMetrics = memo(({ metrics }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-6">
            {Object.entries(metrics).map(([name, { value, description }], index) => {
                const metricValue = value.toFixed(4);
                return (
                    <div key={name} className="flex justify-center items-center">
                        <Popover position="top" withArrow shadow="md" width={220} arrowSize={12} arrowRadius={3}>
                            <Popover.Target>
                                <div className="bg-white shadow-xl rounded-lg p-6 cursor-pointer hover:scale-105 transform transition-all ease-in-out">
                                    <div className="flex flex-col items-center text-center">
                                        <h3 className="text-2xl font-bold text-gray-900 mb-3">{name}</h3>
                                        <div className="text-xl font-semibold text-gray-800 mb-3">
                                            <span className="text-teal-500">{metricValue}</span>
                                        </div>
                                        <p className="text-sm text-gray-600">Metric {index + 1}</p>
                                    </div>
                                </div>
                            </Popover.Target>
                            <Popover.Dropdown className="bg-blue-50 text-blue-600 rounded-lg shadow-lg text-sm p-4">
                                <Text size="sm" className="font-bold text-lg">{name}</Text>
                                <Text size="xs" className="text-gray-500 mb-2">{description}</Text>
                            </Popover.Dropdown>
                        </Popover>
                    </div>
                );
            })}
        </div>
    );
}
);

InfoMetrics.propTypes = {
    metrics: PropTypes.objectOf(
        PropTypes.shape({
            value: PropTypes.number.isRequired,
            description: PropTypes.string.isRequired,
        })
    ).isRequired,
};

export default InfoMetrics;