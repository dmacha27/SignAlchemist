import { Tabs } from '@mantine/core';
import { FaColumns, FaExchangeAlt, FaBalanceScale, FaSignal } from 'react-icons/fa';

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
                <Tabs.Tab value="dual" leftSection={<FaColumns size={14} />}>
                    Dual View
                </Tabs.Tab>
                <Tabs.Tab value="comparison" leftSection={<FaExchangeAlt size={14} />}>
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
                        <div className="p-4">{rightContent}</div>
                    </div>
                </div>
            </Tabs.Panel>

            <Tabs.Panel value="comparison" pt="md">
                <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg mt-6">
                    <div className="bg-gray-100 px-4 py-2 font-semibold flex justify-center gap-2">
                        <FaBalanceScale className="my-auto text-cyan-500" />
                        Comparison View
                    </div>
                    <div className="p-4 text-center">{comparisonContent}</div>
                </div>
            </Tabs.Panel>
        </Tabs>
    );
};

export default SignalPanel;
