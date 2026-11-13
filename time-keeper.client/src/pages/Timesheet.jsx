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
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const zeroPad = (num, places) => String(num).padStart(places, '0');
    useEffect(() => {
        let ignore = false;
        fetchEntries(accessToken).then(data => { if (!ignore) setEntries(data); }).catch(err => { if (!ignore) setError(err.message); });
        return () => { ignore = true; };
    }, [accessToken]);
    const openEntry = entries.find(e => !e.endUTC);

    // Live timer counting clocked in time
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        if (!openEntry) return;
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, [openEntry]);

    const currentText = openEntry
        ? formatDuration(openEntry.startUTC, new Date(now))
        : 'Ready to start';
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
        <div className="timesheetPage_containerOuter">
            <div className="timesheetPage_containerInner timesheetPage_containerInnerTop">
                <div>
                    {openEntry ? <p className="timesheetPage_timeSince_in"> Clocked in since {zeroPad(new Date(openEntry.startUTC).getHours(), 2) + ':' + zeroPad(new Date(openEntry.startUTC).getMinutes(), 2)} </p> : <p className="timesheetPage_timeSince_out"> Clocked out </p>}
                    <h1>
                        {currentText}
                    </h1>
                </div>
                <div>
                    {error && <div className="error-message">{error}</div>}
                    <button className={openEntry ? 'timesheetPage_clockinout button_foreRed' : 'timesheetPage_clockinout button_foreGreen'} onClick={() => sendAction(openEntry ? 'clock-out' : 'clock-in')} disabled={busy} >
                        {openEntry ? 'Clock Out' : 'Clock In'}
                    </button>
                </div>
            </div>
            <div className="timesheetPage_containerInner timesheetPage_containerInnerBottom">
                <div>
                    <h2>
                        Recent entries
                    </h2>
                    <p>
                        Last 50 shown
                    </p>
                </div>
                <table> 
                    <thead>
                        <tr>
                            <th>
                                Date
                            </th>
                            <th>
                                Start
                            </th>
                            <th>
                                End
                            </th>
                            <th>
                                Duration
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map(e => (
                            <tr key={e.id}>
                                <td>
                                    {days[new Date(e.startUTC).getDay()] + ' ' + new Date(e.startUTC).getDate() + ' ' + months[new Date(e.startUTC).getMonth()]}
                                </td>
                                <td>
                                    {zeroPad(new Date(e.startUTC).getHours(), 2) + ':' + zeroPad(new Date(e.startUTC).getMinutes(), 2)}
                                </td>
                                {e.endUTC ?
                                    <td>
                                        {zeroPad(new Date(e.endUTC).getHours(), 2) + ':' + zeroPad(new Date(e.endUTC).getMinutes(), 2)}
                                    </td>
                                    :
                                    <td className="timesheetPage_inProgress">
                                        ● In Progress
                                    </td>
                                }
                                <td>
                                    {e.endUTC ? formatDuration(e.startUTC, e.endUTC) : currentText}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
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