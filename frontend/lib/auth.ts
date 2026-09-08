export type StoredUser = {
  name: string;
  email: string;
  role: string;
  token: string;
};

const USER_STORAGE_KEY = "tf-user";

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;

  const value = localStorage.getItem(USER_STORAGE_KEY);
  if (!value) return null;

  try {
    return JSON.parse(value) as StoredUser;
  } catch {
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
}

export function setStoredUser(user: StoredUser) {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function clearStoredUser() {
  localStorage.removeItem(USER_STORAGE_KEY);
}
