import PropTypes from 'prop-types';
import { Tabs } from '@mantine/core';
import { FaColumns, FaExchangeAlt, FaBalanceScale, FaSignal } from 'react-icons/fa';

/**
 * SignalPanel component displays a tabbed panel with two views: Dual View and Comparison.
 * 
 * @param {Object} props - The props for the component.
 * @param {string} props.rightTitle - The title displayed for the right panel.
 * @param {JSX.Element} props.rightIcon - The icon displayed in the right panel header.
 * @param {JSX.Element} props.leftContent - The content to display in the left panel of the dual view.
 * @param {JSX.Element} props.rightContent - The content to display in the right panel of the dual view.
 * @param {JSX.Element} props.comparisonContent - The content to display in the comparison view.
 */
const SignalPanel = ({
    rightTitle,
    rightIcon,
    leftContent,
    rightContent,
    comparisonContent,
}) => {
    return (
        <Tabs color="indigo" variant="pills" defaultValue="dual" className='mt-2'>
            <Tabs.List justify="center">
                <Tabs.Tab value="dual" className='w-[140px]' leftSection={<FaColumns size={14} />}>
                    Dual View
                </Tabs.Tab>
                <Tabs.Tab value="comparison" className='w-[140px]' leftSection={<FaExchangeAlt size={14} />}>
                    Comparison
                </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="dual" pt="md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
                    <div className="bg-white shadow-md rounded-lg">
                        <div className="bg-gray-100 px-4 py-2 font-semibold flex justify-center gap-2">
                            <FaSignal className="my-auto text-blue-500" />
                            Original Signal
                        </div>
                        <div className="p-4">{leftContent}</div>
                    </div>

                    <div className="bg-white shadow-md rounded-lg">
                        <div className="bg-gray-100 px-4 py-2 font-semibold flex justify-center gap-2">
                            {rightIcon}
                            {rightTitle}
                        </div>
                        <div>{rightContent}</div>
                    </div>
                </div>
            </Tabs.Panel>

            <Tabs.Panel value="comparison" pt="md">
                <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg">
                    <div className="bg-gray-100 px-4 py-2 font-semibold flex justify-center gap-2">
                        <FaBalanceScale className="my-auto text-cyan-500" />
                        Comparison View
                    </div>
                    <div>{comparisonContent}</div>
                </div>
            </Tabs.Panel>
        </Tabs>
    );
};

SignalPanel.propTypes = {
    rightTitle: PropTypes.string.isRequired,
    rightIcon: PropTypes.element.isRequired,
    leftContent: PropTypes.element.isRequired,
    rightContent: PropTypes.element.isRequired,
    comparisonContent: PropTypes.element.isRequired,
};

export default SignalPanel;
