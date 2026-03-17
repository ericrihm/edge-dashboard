function hasChromeStorage() {
  return typeof chrome !== 'undefined' && chrome.storage;
}

export async function getSync(key) {
  if (hasChromeStorage()) {
    const result = await chrome.storage.sync.get(key);
    return result[key];
  }
  const raw = localStorage.getItem(`sync:${key}`);
  return raw ? JSON.parse(raw) : undefined;
}

export async function setSync(key, val) {
  if (hasChromeStorage()) {
    await chrome.storage.sync.set({ [key]: val });
    return;
  }
  localStorage.setItem(`sync:${key}`, JSON.stringify(val));
}

export async function getLocal(key) {
  if (hasChromeStorage()) {
    const result = await chrome.storage.local.get(key);
    return result[key];
  }
  const raw = localStorage.getItem(`local:${key}`);
  return raw ? JSON.parse(raw) : undefined;
}

export async function setLocal(key, val) {
  if (hasChromeStorage()) {
    await chrome.storage.local.set({ [key]: val });
    return;
  }
  localStorage.setItem(`local:${key}`, JSON.stringify(val));
}
