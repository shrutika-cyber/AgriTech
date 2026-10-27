/** Sample (demonstration) data. Everything here is made up. */
export const SAMPLE_PRODUCTS = [
  { name: 'Wheat seed (sample listing)', category: 'seeds', unit: '10 kg bag', price: 450, description: 'Demonstration listing for certified-seed style products.' },
  { name: 'Maize seed (sample listing)', category: 'seeds', unit: '4 kg bag', price: 520, description: 'Demonstration listing.' },
  { name: 'Vegetable seed mix (sample listing)', category: 'seeds', unit: '500 g pack', price: 180, description: 'Demonstration listing.' },
  { name: 'Compost (sample listing)', category: 'organic inputs', unit: '25 kg bag', price: 300, description: 'Demonstration listing for organic matter.' },
  { name: 'Neem cake (sample listing)', category: 'organic inputs', unit: '10 kg bag', price: 380, description: 'Demonstration listing.' },
  { name: 'Hand sprayer 16 L (sample listing)', category: 'tools', unit: 'each', price: 1250, description: 'Demonstration listing.' },
  { name: 'Drip irrigation kit (sample listing)', category: 'tools', unit: 'kit', price: 2400, description: 'Demonstration listing.' },
  { name: 'Soil test kit (sample listing)', category: 'tools', unit: 'kit', price: 950, description: 'Demonstration listing. Lab testing is more reliable.' },
].map((p) => ({ ...p, isSample: true }));

export const DEMO_USER = { name: 'Demo Farmer', email: 'demo@agrismart.local', password: 'Demo@12345' };
