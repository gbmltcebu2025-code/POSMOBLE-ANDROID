// Local, on-device data layer for SwiftPOS.
// Replaces the Base44 SDK entirely — everything is stored in the browser's
// localStorage, so the app works fully offline once installed.

const STORAGE_KEYS = {
  users: 'swiftpos_users',
  session: 'swiftpos_session',
  products: 'swiftpos_products',
  sales: 'swiftpos_sales',
};

// ---------- helpers ----------

function readAll(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(key, items) {
  localStorage.setItem(key, JSON.stringify(items));
}

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function hashPassword(password, salt) {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function sortAndLimit(items, sort, limit) {
  let result = [...items];
  if (sort) {
    const desc = sort.startsWith('-');
    const field = desc ? sort.slice(1) : sort;
    result.sort((a, b) => {
      const av = a[field];
      const bv = b[field];
      if (av === bv) return 0;
      const cmp = av > bv ? 1 : -1;
      return desc ? -cmp : cmp;
    });
  }
  if (limit) result = result.slice(0, limit);
  return result;
}

// ---------- generic entity factory ----------

function createEntity(storageKey) {
  return {
    async list(sort = '-updated_date', limit = 200) {
      const items = readAll(storageKey);
      return sortAndLimit(items, sort, limit);
    },
    async get(id) {
      const items = readAll(storageKey);
      return items.find((i) => i.id === id) || null;
    },
    async create(data) {
      const items = readAll(storageKey);
      const now = new Date().toISOString();
      const record = { id: uid(), created_date: now, updated_date: now, ...data };
      items.push(record);
      writeAll(storageKey, items);
      return record;
    },
    async update(id, data) {
      const items = readAll(storageKey);
      const idx = items.findIndex((i) => i.id === id);
      if (idx === -1) throw new Error('Record not found');
      items[idx] = { ...items[idx], ...data, updated_date: new Date().toISOString() };
      writeAll(storageKey, items);
      return items[idx];
    },
    async delete(id) {
      const items = readAll(storageKey);
      writeAll(storageKey, items.filter((i) => i.id !== id));
      return { success: true };
    },
    async filter(query = {}, sort = '-updated_date', limit = 200) {
      const items = readAll(storageKey);
      const filtered = items.filter((item) =>
        Object.entries(query).every(([k, v]) => item[k] === v)
      );
      return sortAndLimit(filtered, sort, limit);
    },
  };
}

// ---------- auth ----------

const auth = {
  async isAuthenticated() {
    const session = localStorage.getItem(STORAGE_KEYS.session);
    if (!session) return false;
    const users = readAll(STORAGE_KEYS.users);
    return users.some((u) => u.id === session);
  },

  async me() {
    const session = localStorage.getItem(STORAGE_KEYS.session);
    if (!session) throw { status: 401, message: 'Not authenticated' };
    const users = readAll(STORAGE_KEYS.users);
    const user = users.find((u) => u.id === session);
    if (!user) throw { status: 401, message: 'Not authenticated' };
    const { passwordHash, salt, ...safeUser } = user;
    return safeUser;
  },

  async register({ email, password }) {
    const users = readAll(STORAGE_KEYS.users);
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('An account with this email already exists');
    }
    const salt = uid();
    const passwordHash = await hashPassword(password, salt);
    const role = users.length === 0 ? 'admin' : 'user'; // first account is the shop admin
    const user = { id: uid(), email, salt, passwordHash, role, created_date: new Date().toISOString() };
    users.push(user);
    writeAll(STORAGE_KEYS.users, users);
    localStorage.setItem(STORAGE_KEYS.session, user.id);
    const { passwordHash: _p, salt: _s, ...safeUser } = user;
    return safeUser;
  },

  async loginViaEmailPassword(email, password) {
    const users = readAll(STORAGE_KEYS.users);
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) throw new Error('Invalid email or password');
    const hash = await hashPassword(password, user.salt);
    if (hash !== user.passwordHash) throw new Error('Invalid email or password');
    localStorage.setItem(STORAGE_KEYS.session, user.id);
    const { passwordHash: _p, salt: _s, ...safeUser } = user;
    return safeUser;
  },

  // Fully local password reset: since there is no email/backend service,
  // "sending a reset link" just prepares a local token tied to the account.
  // This keeps the same UI flow while working completely offline.
  async resetPasswordRequest(email) {
    const users = readAll(STORAGE_KEYS.users);
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return { sent: true }; // don't reveal whether the account exists
    return { sent: true, token: btoa(`${user.id}:${Date.now()}`) };
  },

  async resetPassword({ resetToken, newPassword }) {
    let userId;
    try {
      userId = atob(resetToken).split(':')[0];
    } catch {
      throw new Error('This reset link is invalid or has expired');
    }
    const users = readAll(STORAGE_KEYS.users);
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) throw new Error('This reset link is invalid or has expired');
    const salt = uid();
    const passwordHash = await hashPassword(newPassword, salt);
    users[idx] = { ...users[idx], salt, passwordHash };
    writeAll(STORAGE_KEYS.users, users);
    return { success: true };
  },

  logout() {
    localStorage.removeItem(STORAGE_KEYS.session);
  },
};

// ---------- integrations (file upload placeholder, kept local) ----------

const integrations = {
  Core: {
    async UploadFile({ file }) {
      // Store images as data URLs locally instead of uploading to a server.
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ file_url: reader.result });
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    },
  },
};

export const db = {
  auth,
  integrations,
  entities: {
    Product: createEntity(STORAGE_KEYS.products),
    SaleTransaction: createEntity(STORAGE_KEYS.sales),
  },
};

export default db;
