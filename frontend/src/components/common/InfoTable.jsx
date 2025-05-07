import { memo, useState } from 'react';
import { Table, Pagination } from '@mantine/core';

/**
 * InfoTable component renders a table displaying signal data and additional information like duration and sampling rate.
 * 
 * @param {Object} props
 * @param {Array} props.table - A 2D array where the first row contains headers and subsequent rows contain data points.
 * @param {boolean} props.onlyTable - A flag indicating whether to display only the table without additional info.
 */
const InfoTable = memo(({ table, onlyTable }) => {
    const headers = table[0];
    const data = table.slice(1);

    const duration = data[data.length - 1][0] - data[0][0];
    const signalLength = data.length;
    const samplingRateCalculated = signalLength / duration;

    const seconds_to_minutes = (s) => {
        const mins = Math.floor(s / 60);
        const secs = Math.floor(s % 60);
        return `${mins} mins ${secs}`;
    };

    const [page, setPage] = useState(1);
    const rowsPerPage = 5;
    const totalPages = Math.ceil(data.length / rowsPerPage);

    const paginatedData = data.slice(
        (page - 1) * rowsPerPage,
        page * rowsPerPage
    );

    const rows = paginatedData.map((row, index) => (
        <Table.Tr key={index}>
            <Table.Td>{(page - 1) * rowsPerPage + index + 1}</Table.Td>
            <Table.Td>{row[0].toFixed(4)}</Table.Td>
            <Table.Td>{row[1].toFixed(4)}</Table.Td>
        </Table.Tr>
    ));

    return (
        <div>
            {!onlyTable && (
                <div className="shadow-sm rounded-xl border p-2 mb-2">
                    <p><strong>Duration:</strong> {seconds_to_minutes(duration)} s</p>
                    <p><strong>Sampling rate:</strong> {samplingRateCalculated.toFixed(1)} Hz</p>
                    <p><strong>Signal length:</strong> {signalLength} samples</p>
                </div>
            )}
            <div className="shadow-md rounded-xl border p-2">
                <Table striped withColumnBorders withRowBorders={false}>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>#</Table.Th>
                            <Table.Th>{headers[0]}</Table.Th>
                            <Table.Th>{headers[1]}</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{rows}</Table.Tbody>
                </Table>

                {totalPages > 1 && (
                    <div className="flex justify-center mt-4">
                        <Pagination
                            value={page}
                            onChange={setPage}
                            total={totalPages}
                        />
                    </div>
                )}
            </div>
        </div>
    );
});

export default InfoTable;
