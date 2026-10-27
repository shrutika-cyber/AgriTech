import { Link } from 'react-router-dom';
import CrudPage from '../components/CrudPage.jsx';
import { api } from '../services/api.js';
import { useLoad } from '../hooks/useLoad.js';
import { Badge, EmptyState } from '../components/ui.jsx';
import { fmtDate } from '../utils/format.js';

const fields = [
  { name: 'farmId', label: 'Farm', type: 'select', required: true, options: (x) => (x.farms || []).map((f) => ({ value: f.id, label: f.name })) },
  { name: 'crop', label: 'Crop', required: true, help: 'For example Wheat, Rice, Tomato' },
  { name: 'variety', label: 'Variety' },
  { name: 'status', label: 'Status', type: 'select', required: true, default: 'planned', options: [{ value: 'planned', label: 'Planned' }, { value: 'growing', label: 'Growing' }, { value: 'harvested', label: 'Harvested' }] },
  { name: 'sowingDate', label: 'Sowing date', type: 'date' },
  { name: 'expectedHarvestDate', label: 'Expected harvest', type: 'date' },
  { name: 'harvestDate', label: 'Harvest date', type: 'date' },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];
const tone = { planned: 'neutral', growing: 'good', harvested: 'warn' };
const columns = [
  { label: 'Crop', render: (c) => <><b>{c.crop}</b>{c.variety ? ` (${c.variety})` : ''}</> },
  { label: 'Farm', render: (c, x) => (x.farms || []).find((f) => f.id === c.farmId)?.name || '–' },
  { label: 'Status', render: (c) => <Badge tone={tone[c.status]}>{c.status}</Badge> },
  { label: 'Sown', render: (c) => fmtDate(c.sowingDate) },
  { label: 'Harvest', render: (c) => fmtDate(c.harvestDate || c.expectedHarvestDate) },
];

export default function Crops() {
  const { data: farms, loading } = useLoad(() => api.get('/farms'), []);
  const blocker = !loading && farms?.length === 0
    ? <EmptyState title="Add a farm first"><p>Crops belong to a farm.</p><Link className="btn btn-primary" to="/farms">Add a farm</Link></EmptyState> : null;
  return <CrudPage title="Crop records" intro="Track what you grow, with sowing and harvest dates." noun="Crop" endpoint="/crops" fields={fields} columns={columns} loadExtra={async () => ({ farms: await api.get('/farms') })} blocker={blocker} />;
}
