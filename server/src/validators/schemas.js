const SOIL_TYPES = ['sandy', 'loamy', 'clay', 'silty', 'black', 'red', 'other'];
const id = { type: 'string', maxLength: 64 };

export const registerSchema = {
  name: { type: 'string', required: true, minLength: 2, maxLength: 80, label: 'Name' },
  email: { type: 'email', required: true, label: 'Email' },
  password: { type: 'string', required: true, minLength: 8, maxLength: 72, label: 'Password' },
};
export const loginSchema = {
  email: { type: 'email', required: true, label: 'Email' },
  password: { type: 'string', required: true, maxLength: 72, label: 'Password' },
};
export const profileSchema = {
  name: { type: 'string', minLength: 2, maxLength: 80, label: 'Name' },
  phone: { type: 'string', maxLength: 20, label: 'Phone', nullable: true },
  areaUnit: { type: 'enum', values: ['acres', 'hectares'], label: 'Area unit' },
  tempUnit: { type: 'enum', values: ['C', 'F'], label: 'Temperature unit' },
};
export const passwordSchema = {
  currentPassword: { type: 'string', required: true, maxLength: 72, label: 'Current password' },
  newPassword: { type: 'string', required: true, minLength: 8, maxLength: 72, label: 'New password' },
};
export const farmSchema = {
  name: { type: 'string', required: true, minLength: 2, maxLength: 100, label: 'Farm name' },
  locationLabel: { type: 'string', maxLength: 150, label: 'Location', nullable: true },
  areaValue: { type: 'number', min: 0, max: 1000000, label: 'Area', nullable: true },
  areaUnit: { type: 'enum', values: ['acres', 'hectares'], label: 'Area unit' },
  soilType: { type: 'enum', values: SOIL_TYPES, label: 'Soil type' },
  notes: { type: 'string', maxLength: 1000, label: 'Notes', nullable: true },
};
export const cropSchema = {
  farmId: { ...id, required: true, label: 'Farm' },
  crop: { type: 'string', required: true, minLength: 2, maxLength: 80, label: 'Crop' },
  variety: { type: 'string', maxLength: 80, label: 'Variety', nullable: true },
  status: { type: 'enum', values: ['planned', 'growing', 'harvested'], label: 'Status' },
  sowingDate: { type: 'date', label: 'Sowing date', nullable: true },
  expectedHarvestDate: { type: 'date', label: 'Expected harvest date', nullable: true },
  harvestDate: { type: 'date', label: 'Harvest date', nullable: true },
  notes: { type: 'string', maxLength: 1000, label: 'Notes', nullable: true },
};
export const soilSchema = {
  farmId: { ...id, label: 'Farm', nullable: true },
  locationLabel: { type: 'string', maxLength: 150, label: 'Location', nullable: true },
  ph: { type: 'number', required: true, min: 0, max: 14, label: 'Soil pH' },
  nitrogen: { type: 'number', min: 0, max: 5000, label: 'Nitrogen (kg/ha)' },
  phosphorus: { type: 'number', min: 0, max: 1000, label: 'Phosphorus (kg/ha)' },
  potassium: { type: 'number', min: 0, max: 5000, label: 'Potassium (kg/ha)' },
  moisture: { type: 'number', min: 0, max: 100, label: 'Moisture (%)' },
  soilType: { type: 'enum', values: SOIL_TYPES, label: 'Soil type' },
  notes: { type: 'string', maxLength: 1000, label: 'Notes', nullable: true },
};
export const reminderSchema = {
  title: { type: 'string', required: true, minLength: 2, maxLength: 120, label: 'Title' },
  dueDate: { type: 'date', required: true, label: 'Due date' },
  farmId: { ...id, label: 'Farm', nullable: true },
  done: { type: 'boolean', label: 'Done' },
  notes: { type: 'string', maxLength: 500, label: 'Notes', nullable: true },
};
export const recommendSchema = {
  ph: { type: 'number', min: 0, max: 14, label: 'Soil pH' },
  nitrogen: { type: 'number', min: 0, max: 5000, label: 'Nitrogen' },
  phosphorus: { type: 'number', min: 0, max: 1000, label: 'Phosphorus' },
  potassium: { type: 'number', min: 0, max: 5000, label: 'Potassium' },
  temperature: { type: 'number', min: -10, max: 55, label: 'Average temperature (°C)' },
  rainfall: { type: 'number', min: 0, max: 6000, label: 'Annual rainfall (mm)' },
  soilType: { type: 'enum', values: SOIL_TYPES, label: 'Soil type' },
  season: { type: 'enum', values: ['kharif', 'rabi', 'zaid'], label: 'Season' },
};
export const postSchema = {
  title: { type: 'string', required: true, minLength: 3, maxLength: 120, label: 'Title' },
  body: { type: 'string', required: true, minLength: 3, maxLength: 2000, label: 'Message' },
  category: { type: 'enum', values: ['question', 'tip', 'discussion'], label: 'Category' },
};
export const consultationSchema = {
  topic: { type: 'enum', required: true, values: ['crop-selection', 'soil-health', 'pest-disease', 'irrigation', 'other'], label: 'Topic' },
  crop: { type: 'string', maxLength: 80, label: 'Crop', nullable: true },
  farmId: { ...id, label: 'Farm', nullable: true },
  message: { type: 'string', required: true, minLength: 10, maxLength: 2000, label: 'Your question' },
};
