const QUEUE_KEY = 'faidaplus-offline-queue';
const CACHE_PREFIX = 'faidaplus-cache:';

export const getStorage = (storage) => storage || (typeof window !== 'undefined' ? window.localStorage : null);

export const getCacheKey = (url) => `${CACHE_PREFIX}${url}`;

export const loadQueue = (storage) => {
  const currentStorage = getStorage(storage);
  if (!currentStorage) return [];

  try {
    const raw = currentStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.warn('Failed to load offline queue:', error);
    return [];
  }
};

export const saveQueue = (queue, storage) => {
  const currentStorage = getStorage(storage);
  if (!currentStorage) return;

  currentStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
};

export const queueRequest = (request, storage) => {
  const queue = loadQueue(storage);
  queue.push({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    method: request.method || 'GET',
    url: request.url,
    data: request.data,
    headers: request.headers || {},
    timestamp: Date.now(),
  });
  saveQueue(queue, storage);
  return queue;
};

export const flushQueue = async (axiosInstance, storage) => {
  const currentStorage = getStorage(storage);
  if (!axiosInstance || !currentStorage) return [];

  const queue = loadQueue(currentStorage);
  if (!queue.length) return [];

  const remaining = [];

  for (const item of queue) {
    try {
      await axiosInstance({
        method: item.method || 'GET',
        url: item.url,
        data: item.data,
        headers: item.headers || {},
      });
    } catch (error) {
      remaining.push(item);
      console.warn('Offline sync failed for queued request:', error);
    }
  }

  saveQueue(remaining, currentStorage);
  if (remaining.length === 0 && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('faidaplus-sync-synced', {
      detail: { message: 'Offline changes were synced successfully.' },
    }));
  }

  return remaining;
};

export const registerOfflineSync = (axiosInstance, options = {}) => {
  const currentStorage = getStorage(options.storage);
  if (!axiosInstance || !currentStorage || typeof window === 'undefined') {
    return () => {};
  }

  const notifyQueued = (message) => {
    window.dispatchEvent(new CustomEvent('faidaplus-sync-queued', {
      detail: { message },
    }));
  };

  const requestInterceptor = axiosInstance.interceptors.request.use((config) => {
    const method = (config.method || 'get').toUpperCase();

    if (method === 'GET' && !window.navigator.onLine) {
      const cacheKey = getCacheKey(config.url || '');
      const cached = currentStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        return Promise.reject({ __cachedResponse: parsed, config });
      }
    }

    return config;
  });

  const responseInterceptor = axiosInstance.interceptors.response.use(
    (response) => {
      const config = response.config || {};
      const method = (config.method || 'get').toUpperCase();
      if (method === 'GET' && config.url) {
        currentStorage.setItem(getCacheKey(config.url), JSON.stringify(response.data));
      }
      return response;
    },
    async (error) => {
      const config = error.config || {};
      const method = (config.method || 'get').toUpperCase();

      if (error?.__cachedResponse) {
        return Promise.resolve({
          data: error.__cachedResponse,
          status: 200,
          statusText: 'OK',
          config,
        });
      }

      if (!window.navigator.onLine && method !== 'GET') {
        queueRequest(config, currentStorage);
        notifyQueued('Saved offline and will sync automatically when the connection returns.');
        return Promise.resolve({
          data: { queued: true, message: 'Saved offline and will sync when the connection returns.' },
          status: 202,
          statusText: 'Queued',
          config,
        });
      }

      return Promise.reject(error);
    }
  );

  const flush = () => {
    if (window.navigator.onLine) {
      void flushQueue(axiosInstance, currentStorage);
    }
  };

  window.addEventListener('online', flush);

  if (window.navigator.onLine) {
    flush();
  }

  return () => {
    axiosInstance.interceptors.request.eject(requestInterceptor);
    axiosInstance.interceptors.response.eject(responseInterceptor);
    window.removeEventListener('online', flush);
  };
};
