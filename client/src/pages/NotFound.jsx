import { Link } from 'react-router-dom';
export default function NotFound() {
  return <section className="page narrow"><h1>Page not found</h1><p>That page does not exist.</p><Link className="btn btn-primary" to="/">Go to the home page</Link></section>;
}
