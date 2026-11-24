// Oddiy lokal akkauntlar (brauzerda saqlanadi). Real loyihada backend kerak.
const USERS_KEY = "mactube_users";
const SESSION_KEY = "mactube_session";

const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};

const saveSession = (u) => {
  const s = { name: u.name, email: u.email };
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  return s;
};

export function currentUser() {
  return read(SESSION_KEY, null);
}

export function register(name, email, password) {
  name = name.trim();
  email = email.trim().toLowerCase();
  if (!name) throw new Error("Ismingizni kiriting");
  if (!email.includes("@")) throw new Error("To'g'ri email kiriting");
  if (password.length < 4) throw new Error("Parol kamida 4 ta belgidan iborat bo'lsin");
  const users = read(USERS_KEY, []);
  if (users.some((u) => u.email === email)) throw new Error("Bu email allaqachon ro'yxatdan o'tgan");
  const user = { name, email, password };
  users.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return saveSession(user);
}

export function login(email, password) {
  email = email.trim().toLowerCase();
  const user = read(USERS_KEY, []).find((u) => u.email === email && u.password === password);
  if (!user) throw new Error("Email yoki parol noto'g'ri");
  return saveSession(user);
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}
