import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { useLoad } from '../hooks/useLoad.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Badge, DemoNotice, EmptyState, ErrorState, Loading } from '../components/ui.jsx';
import { fmtTemp } from '../utils/format.js';

const tone = { warning: 'danger', watch: 'warn', info: 'neutral', good: 'good' };

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useLoad(() => api.get('/dashboard'), []);
  if (loading) return <section className="page"><Loading /></section>;
  if (error) return <section className="page"><ErrorState message={error} onRetry={reload} /></section>;
  const { counts, latestSoil, alerts, weather } = data;
  const unit = user.preferences?.tempUnit;

  return (
    <section className="page">
      <h1>Welcome, {user.name.split(' ')[0]}</h1>
      {counts.farms === 0 && (
        <EmptyState title="Let’s set up your first farm">
          <p>Add a farm, then record crops and soil readings to see summaries here.</p>
          <Link className="btn btn-primary" to="/farms">Add a farm</Link>
        </EmptyState>
      )}
      <div className="stats">
        <Link className="stat" to="/farms"><b>{counts.farms}</b><span>Farms</span></Link>
        <Link className="stat" to="/crops"><b>{counts.activeCrops}</b><span>Active crops</span></Link>
        <Link className="stat" to="/alerts"><b>{counts.openReminders}</b><span>Open reminders</span></Link>
        <Link className="stat" to="/soil"><b>{counts.soilAnalyses}</b><span>Soil analyses</span></Link>
      </div>
      <div className="grid2">
        <article className="card">
          <h2>Weather today</h2>
          <DemoNotice>{weather.notice}</DemoNotice>
          <p className="big">{fmtTemp(weather.current.temperature, unit)} <small>humidity {weather.current.humidity}%</small></p>
          <p className="muted">High {fmtTemp(weather.today.tempMax, unit)}, low {fmtTemp(weather.today.tempMin, unit)}, rain {weather.today.rain} mm</p>
          <Link to="/weather">See 7-day view</Link>
        </article>
        <article className="card">
          <h2>Latest soil analysis</h2>
          {latestSoil ? (
            <>
              <p>pH <b>{latestSoil.ph}</b>: {latestSoil.assessment?.overall}</p>
              <p className="muted small">Rule-based educational guidance, not a lab result.</p>
              <Link to="/soil">View history</Link>
            </>
          ) : <p className="muted">No soil readings yet. <Link to="/soil">Add one</Link>.</p>}
        </article>
      </div>
      <article className="card">
        <h2>Alerts &amp; reminders</h2>
        {alerts.length === 0 ? <p className="muted">Nothing needs attention right now.</p> : (
          <ul className="list">
            {alerts.map((a) => (
              <li key={a.id}><Badge tone={tone[a.severity]}>{a.type}</Badge> <b>{a.title}</b>{a.isSimulated && <Badge tone="demo">simulated</Badge>}<br /><span className="muted">{a.message}</span></li>
            ))}
          </ul>
        )}
        <Link to="/alerts">All alerts, reminders and the pest guide</Link>
      </article>
      <div className="quick">
        <Link className="btn btn-secondary" to="/farms">Manage farms</Link>
        <Link className="btn btn-secondary" to="/soil">Add soil reading</Link>
        <Link className="btn btn-secondary" to="/advisor">Get crop suggestions</Link>
        <Link className="btn btn-secondary" to="/alerts">Search pest guide</Link>
      </div>
    </section>
  );
}
