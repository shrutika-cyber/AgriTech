import { useState } from 'react';
import { api } from '../services/api.js';
import { useLoad } from '../hooks/useLoad.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Badge, DemoNotice, ErrorState, Field, Loading } from '../components/ui.jsx';
import { fmtDate, fmtTemp } from '../utils/format.js';

const tone = { warning: 'danger', watch: 'warn', good: 'good' };

export default function Weather() {
  const { user } = useAuth();
  const unit = user.preferences?.tempUnit;
  const [input, setInput] = useState('');
  const [location, setLocation] = useState('');
  const { data, loading, error, reload } = useLoad(() => api.get(`/weather?location=${encodeURIComponent(location)}`), [location]);

  return (
    <section className="page">
      <h1>Weather</h1>
      <form className="row" onSubmit={(e) => { e.preventDefault(); setLocation(input.trim()); }}>
        <Field id="loc" label="Location label"><input id="loc" value={input} onChange={(e) => setInput(e.target.value)} placeholder="e.g. my village" maxLength={80} /></Field>
        <button className="btn btn-primary">Update</button>
      </form>
      {loading && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (
        <>
          <DemoNotice>{data.notice} The location label only changes the heading; it does not change the numbers.</DemoNotice>
          <article className="card"><h2>{data.location}</h2>
            <p className="big">{fmtTemp(data.current.temperature, unit)} <small>humidity {data.current.humidity}% · wind {data.current.wind} km/h</small></p>
          </article>
          <div className="table-wrap"><table><thead><tr><th>Date</th><th>High / low</th><th>Rain</th><th>Wind</th><th>Farming notes</th></tr></thead><tbody>
            {data.daily.map((d, i) => (
              <tr key={d.date}>
                <td data-label="Date">{fmtDate(d.date)}</td>
                <td data-label="High / low">{fmtTemp(d.tempMax, unit)} / {fmtTemp(d.tempMin, unit)}</td>
                <td data-label="Rain">{d.rain} mm</td>
                <td data-label="Wind">{d.windMax} km/h</td>
                <td data-label="Notes">{data.advice[i].advice.map((a) => <div key={a.text}><Badge tone={tone[a.level]}>{a.level}</Badge> {a.text}</div>)}</td>
              </tr>
            ))}
          </tbody></table></div>
        </>
      )}
    </section>
  );
}
