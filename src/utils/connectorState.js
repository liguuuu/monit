const STORAGE_KEY = 'connector-state-v1';

const isBrowser = () => typeof window !== 'undefined';

const readSnapshots = () => {
  if (!isBrowser() || !window.localStorage) {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.warn('无法读取缓存的连接器状态，已重置。', error);
    return {};
  }
};

const writeSnapshots = (snapshot) => {
  if (!isBrowser() || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch (error) {
    console.warn('无法写入连接器状态缓存。', error);
  }
};

const getConnectorKey = (connector) => {
  if (connector?.device_no !== undefined && connector?.device_no !== null) {
    return String(connector.device_no);
  }
  if (connector?.id !== undefined && connector?.id !== null) {
    return String(connector.id);
  }
  return null;
};

const buildFingerprint = (connector = {}) => {
  const payload = {
    status: connector.status ?? null,
    environmentA: connector.environmentA ?? null,
    environmentB: connector.environmentB ?? null,
    environmentC: connector.environmentC ?? null,
    environmentD: connector.environmentD ?? null
  };
  return JSON.stringify(payload);
};

const normalizeConnectors = (list = []) => {
  const seen = new Map();
  list.forEach(item => {
    const key = getConnectorKey(item);
    if (!key || seen.has(key)) {
      return;
    }
    seen.set(key, { ...item });
  });
  return Array.from(seen.values());
};

export const applyConnectorSnapshots = (rawList = []) => {
  const normalized = normalizeConnectors(rawList);
  if (!normalized.length) {
    return [];
  }

  const snapshots = readSnapshots();
  const now = Date.now();

  const result = normalized.map(connector => {
    const key = getConnectorKey(connector);
    const deviceIndex = Number(connector?.device_no ?? connector?.id);
    const hasValidIndex = Number.isFinite(deviceIndex);
    const displayName = hasValidIndex
      ? `连接器 ${deviceIndex + 1}`
      : (connector?.name || '连接器');
    if (!key) {
      return {
        ...connector,
        name: connector?.name || displayName,
        displayName,
        lastUpdateTime: now
      };
    }

    const fingerprint = buildFingerprint(connector);
    const cached = snapshots[key];
    if (!cached || cached.fingerprint !== fingerprint) {
      snapshots[key] = {
        fingerprint,
        lastUpdateTime: now
      };
    }

    return {
      ...connector,
      name: connector?.name || displayName,
      displayName,
      lastUpdateTime: snapshots[key].lastUpdateTime
    };
  });

  writeSnapshots(snapshots);

  return result.sort((a, b) => {
    const aNo = a.device_no ?? Number.MAX_SAFE_INTEGER;
    const bNo = b.device_no ?? Number.MAX_SAFE_INTEGER;
    return aNo - bNo;
  });
};

export const clearConnectorSnapshots = () => {
  if (!isBrowser() || !window.localStorage) {
    return;
  }
  window.localStorage.removeItem(STORAGE_KEY);
};



