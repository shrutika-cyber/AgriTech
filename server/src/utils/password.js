// bcryptjs is loaded lazily so unit tests can inject a fake hasher without the package installed.
let lib;
async function bcrypt() { return (lib ??= (await import('bcryptjs')).default); }
export const passwordHasher = {
  async hash(plain) { return (await bcrypt()).hash(plain, 10); },
  async compare(plain, hash) { return (await bcrypt()).compare(plain, hash); },
};
