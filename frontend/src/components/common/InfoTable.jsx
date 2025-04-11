import { Table } from 'react-bootstrap'; // Si estás usando React-Bootstrap

const max_length_lag = 5000;

/**
 * InfoTable component renders a table displaying signal data and additional information like duration and sampling rate.
 * 
 * @param {Object} props
 * @param {Array} props.table - A 2D array where the first row contains headers and subsequent rows contain data points.
 * @param {boolean} props.onlyTable - A flag indicating whether to display only the table without additional info.
 */
const InfoTable = ({ table, onlyTable }) => {
    // table: [[header, header], [x1, y1], [x2, y2], [x3, y3]]

    const headers = table[0];
    const data = table.slice(1);

    const duration = data[data.length - 1][0] - data[0][0];
    const signalLength = data.length;
    const samplingRateCalculated = (signalLength / duration);

    // Stackoverflow: https://stackoverflow.com/questions/3733227/javascript-seconds-to-minutes-and-seconds
    const seconds_to_minutes = (s) => { return (s - (s %= 60)) / 60 + (9 < s ? 'mins ' : 'mins') + s }


    return (
        <div>
            {!onlyTable && (
                <div className='shadow-sm rounded border p-1'>
                    <p><strong>Duration:</strong> {
                        seconds_to_minutes(duration)
                    } s</p>
                    <p><strong>Sampling rate:</strong> {samplingRateCalculated.toFixed(1)} Hz</p>
                    <p><strong>Signal length:</strong> {signalLength} samples</p>
                </div>
                )
                }

            <div className="shadow-sm" style={{ maxHeight: '230px', overflowY: 'auto', marginTop: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
                <Table striped bordered hover size="sm">
                    <thead>
                        <tr style={{ position: 'sticky', top: 0 }}>
                            <th>{(data.length > max_length_lag) ? "Truncated" : ""}</th>
                            <th>{headers[0]}</th>
                            <th>{headers[1]}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.slice(0, max_length_lag).map((row, index) => (
                            <tr key={index}>
                                <td>{index + 1}</td>
                                <td>{row[0].toFixed(4)}</td>
                                <td>{row[1].toFixed(4)}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>
        </div>
    );
};

export default InfoTable;