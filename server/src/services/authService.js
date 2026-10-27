import { HttpError } from '../utils/errors.js';
import { validate } from '../utils/validate.js';
import { registerSchema, loginSchema, profileSchema, passwordSchema } from '../validators/schemas.js';

export const toPublic = (u) => ({
  id: u.id, name: u.name, email: u.email, role: u.role, phone: u.phone || '',
  preferences: u.preferences, isDemo: Boolean(u.isDemo), createdAt: u.createdAt,
});

function checkPasswordStrength(pw, field = 'password') {
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) {
    throw new HttpError(400, 'Please correct the highlighted fields', { fields: { [field]: 'Password must contain at least one letter and one number' } });
  }
}

export function createAuthService(store, hasher) {
  // A real-looking hash to compare against when the email is unknown, so timing does not reveal which emails exist.
  let dummyHash;
  const getDummy = async () => (dummyHash ??= await hasher.hash('not-a-real-password-1'));

  return {
    async register(body) {
      const data = validate(body, registerSchema); // NOTE: 'role' is not in the schema, so it can never be supplied by the client
      checkPasswordStrength(data.password);
      if (await store.users.findOne((u) => u.email === data.email)) {
        throw new HttpError(409, 'An account with this email already exists', { fields: { email: 'This email is already registered' } });
      }
      const user = await store.users.insert({
        name: data.name, email: data.email, passwordHash: await hasher.hash(data.password),
        role: 'farmer', phone: '', preferences: { areaUnit: 'acres', tempUnit: 'C' },
      });
      return toPublic(user);
    },

    async login(body) {
      const data = validate(body, loginSchema);
      const user = await store.users.findOne((u) => u.email === data.email);
      const ok = await hasher.compare(data.password, user ? user.passwordHash : await getDummy());
      if (!user || !ok) throw new HttpError(401, 'Incorrect email or password');
      return toPublic(user);
    },

    async updateProfile(userId, body) {
      const data = validate(body, profileSchema, { partial: true });
      const user = await store.users.get(userId);
      const patch = {};
      if (data.name !== undefined) patch.name = data.name;
      if (data.phone !== undefined) patch.phone = data.phone ?? '';
      if (data.areaUnit || data.tempUnit) {
        patch.preferences = { ...user.preferences, ...(data.areaUnit && { areaUnit: data.areaUnit }), ...(data.tempUnit && { tempUnit: data.tempUnit }) };
      }
      return toPublic(await store.users.update(userId, patch)); // role/email/passwordHash can never be changed here
    },

    async changePassword(userId, body) {
      const data = validate(body, passwordSchema);
      checkPasswordStrength(data.newPassword, 'newPassword');
      const user = await store.users.get(userId);
      if (!(await hasher.compare(data.currentPassword, user.passwordHash))) {
        throw new HttpError(400, 'Please correct the highlighted fields', { fields: { currentPassword: 'Current password is incorrect' } });
      }
      await store.users.update(userId, { passwordHash: await hasher.hash(data.newPassword) });
      return { changed: true };
    },
  };
}
