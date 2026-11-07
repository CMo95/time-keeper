import { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import './styling/Timesheet.css';

async function fetchEntries(accessToken) {
    const response = await fetch('/api/timeentries', {
        headers: { 'Authorization': 'Bearer ' + accessToken }
    });
    if (!response.ok) {
        throw new Error('Could not load time entries');
    }
    return response.json();
}
function Timesheet({ token }) {
    const [entries, setEntries] = useState([]);
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);
    const accessToken = token.accessToken;
    useEffect(() => {
        let ignore = false;
        fetchEntries(accessToken).then(data => { if (!ignore) setEntries(data); }).catch(err => { if (!ignore) setError(err.message); });
        return () => { ignore = true; };
    }, [accessToken]);
    const openEntry = entries.find(e => !e.endUTC);
    const sendAction = async (action) => {
        setBusy(true);
        setError(null);
        try {
            const response = await fetch(`/api/timeentries/${action}`,
                {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + accessToken }
                });
            if (!response.ok) {
                throw new Error((await response.text()) || 'Request failed');
            }
            setEntries(await fetchEntries(accessToken));
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    };
    return (
        <div className="timesheet">
            <h2>Timesheet</h2>
            {error && <div className="error-message">{error}</div>}
            <button onClick={() => sendAction(openEntry ? 'clock-out' : 'clock-in')} disabled={busy} >
                {openEntry ? 'Clock Out' : 'Clock In'}
            </button>
            <table> 
                <thead>
                    <tr>
                        <th>Start Time</th>
                        <th>End Time</th>
                        <th>Duration</th>
                    </tr>
                </thead>
                <tbody>
                    {entries.map(e => (
                        <tr key={e.id}>
                            <td>
                                {new Date(e.startUTC).toLocaleString()}
                            </td>
                            <td>
                                {e.endUTC ? new Date(e.endUTC).toLocaleString() : 'In Progress'}
                            </td>
                            <td>
                                {e.endUTC ? formatDuration(e.startUTC, e.endUTC) : '-'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function formatDuration(startUTC, endUTC) {
    const totalMinutes = Math.round((new Date(endUTC) - new Date(startUTC)) / 60000);
    return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
}

Timesheet.propTypes = {
    token: PropTypes.shape({ accessToken: PropTypes.string.isRequired }).isRequired
};

export default Timesheet;