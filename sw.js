const CACHE_NAME = 'protolix-v1';
const ASSETS = [
  './index.html',
  './manifest.json',
  './admin.html',
  './mobile-admin.html',
  './style.css',
  './bgindex.jpg',
  './bgshabbat.jpg',
  './bgshabbattimes.jpg'
];

// התקנה — שמור את כל הקבצים בזיכרון
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('שומר קבצים לשימוש אופליין...');
      return Promise.all(ASSETS.map(a => cache.add(a).catch(() => console.log('חסר:', a))));
    })
  );
  self.skipWaiting();
});

// הפעלה — מחק cache ישן
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// בקשת רשת — נסה רשת קודם, אחר כך cache
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  // Firebase ובקשות חיצוניות — תמיד מהרשת
  if (event.request.url.includes('firebase') ||
      event.request.url.includes('gstatic') ||
      event.request.url.includes('googleapis') ||
      event.request.url.includes('hebcal')) {
    event.respondWith(fetch(event.request).catch(() => new Response('')));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // אם הצלחנו — עדכן את ה-cache
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // אין אינטרנט — טען מה-cache
        return caches.match(event.request).then(r => r || Response.error());
      })
  );
});
