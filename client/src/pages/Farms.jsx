import CrudPage from '../components/CrudPage.jsx';

export const SOIL_OPTIONS = ['sandy', 'loamy', 'clay', 'silty', 'black', 'red', 'other'].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }));

const fields = [
  { name: 'name', label: 'Farm name', required: true },
  { name: 'locationLabel', label: 'Location (village / district)' },
  { name: 'areaValue', label: 'Area', type: 'number', step: 'any' },
  { name: 'areaUnit', label: 'Area unit', type: 'select', required: true, default: 'acres', options: [{ value: 'acres', label: 'Acres' }, { value: 'hectares', label: 'Hectares' }] },
  { name: 'soilType', label: 'Main soil type', type: 'select', required: true, default: 'other', options: SOIL_OPTIONS },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];
const columns = [
  { label: 'Farm', render: (f) => <b>{f.name}</b> },
  { label: 'Location', render: (f) => f.locationLabel || '–' },
  { label: 'Area', render: (f) => (f.areaValue != null ? `${f.areaValue} ${f.areaUnit}` : '–') },
  { label: 'Soil', render: (f) => f.soilType },
];

export default function Farms() {
  return <CrudPage title="My farms" intro="Create the farms you manage. Crops, reminders and soil readings can be linked to them." noun="Farm" endpoint="/farms" fields={fields} columns={columns} />;
}
