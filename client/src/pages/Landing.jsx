import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const FEATURES = [
  ['🌦️', 'Weather view', 'A 7-day outlook with plain-language farming notes. In this demo the numbers are simulated and labelled as such.'],
  ['🧪', 'Soil analysis', 'Enter pH, N-P-K and moisture and get educational, rule-based guidance, plus a history you can compare.'],
  ['🌾', 'Crop advisor', 'Transparent rules suggest candidate crops and explain why. No AI model is used or claimed.'],
  ['🐛', 'Pest & disease guide', 'Searchable library with symptoms, prevention and safe next steps. Guidance only, never a diagnosis.'],
  ['🚜', 'Farm records', 'Keep farms, crops, sowing/harvest dates and reminders in one place.'],
  ['🛒', 'Marketplace & community', 'Browse sample resources, post questions and send consultation requests (all simulated in this demo).'],
];
const STEPS = ['Create a free account', 'Add your farm and crops', 'Record soil readings and get guidance', 'Check alerts and reminders'];
const FAQ = [
  ['Is the weather real?', 'No. In this local demo the weather is simulated and clearly labelled. A real provider can be connected later.'],
  ['Does it give fertilizer doses or diagnose diseases?', 'No. It gives general educational guidance only. For doses, diagnosis or pesticide choice, ask a qualified local agriculture officer and follow product labels.'],
  ['Where is my data stored?', 'In local JSON files on the computer running the server. It is not MongoDB and not in the cloud.'],
  ['Are the marketplace orders real?', 'No. Orders are simulated: no payment is taken and nothing is delivered.'],
];

export default function Landing() {
  const { user } = useAuth();
  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <p className="eyebrow">Student demo project</p>
          <h1>Smarter farm decisions, in one simple place</h1>
          <p className="lead">AgriSmart brings farm records, soil guidance, crop suggestions and pest information together in an easy-to-use app.</p>
          <div className="row">
            <Link className="btn btn-light btn-lg" to={user ? '/dashboard' : '/register'}>{user ? 'Open dashboard' : 'Get started'}</Link>
            {!user && <Link className="btn btn-outline-light btn-lg" to="/login">Log in</Link>}
          </div>
        </div>
      </section>
      <section className="section">
        <h2>What you can do</h2>
        <div className="grid3">
          {FEATURES.map(([icon, t, d]) => <article className="card feature" key={t}><span className="icon" aria-hidden="true">{icon}</span><h3>{t}</h3><p>{d}</p></article>)}
        </div>
      </section>
      <section className="section alt">
        <h2>How it works</h2>
        <ol className="steps">{STEPS.map((s) => <li key={s}>{s}</li>)}</ol>
      </section>
      <section className="section narrow">
        <h2>Frequently asked questions</h2>
        {FAQ.map(([q, a]) => <details key={q} className="faq"><summary>{q}</summary><p>{a}</p></details>)}
      </section>
    </>
  );
}
