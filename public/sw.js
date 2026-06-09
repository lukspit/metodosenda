const CACHE_NAME = 'senda-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/logo.png',
  '/logo_transparent.png',
];

// Instalação do Service Worker e cache inicial
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interceptação de requisições (fetch)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Evitar interceptar chamadas de API do Supabase ou de autenticação com cache (queremos sempre live data)
  // Ou seja, chamadas para /api, supabase, ou do tipo POST/PUT/DELETE
  if (
    request.method !== 'GET' ||
    url.pathname.startsWith('/api') ||
    url.href.includes('supabase.co') ||
    url.pathname.startsWith('/_next/webpack-hmr')
  ) {
    // Estratégia Network Only para APIs e mutações
    return;
  }

  // Para páginas e assets estáticos
  event.respondWith(
    // Tenta primeiro a rede (Network-First) para páginas HTML para garantir que o dashboard atualize
    // Para imagens e fontes, podemos tentar o Cache-First.
    isStaticAsset(url.pathname)
      ? cacheFirst(request)
      : networkFirst(request)
  );
});

// Auxiliar para identificar assets estáticos
function isStaticAsset(pathname) {
  return (
    pathname.startsWith('/_next/static') ||
    pathname.startsWith('/icons') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.webp') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.woff2')
  );
}

// Estratégia Cache-First (busca no cache, se não achar, busca na rede e salva no cache)
function cacheFirst(request) {
  return caches.match(request).then((cachedResponse) => {
    if (cachedResponse) {
      return cachedResponse;
    }

    return fetch(request).then((networkResponse) => {
      if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
        return networkResponse;
      }

      const responseToCache = networkResponse.clone();
      caches.open(CACHE_NAME).then((cache) => {
        cache.put(request, responseToCache);
      });

      return networkResponse;
    }).catch(() => {
      // Se falhar rede e não tiver no cache, retorna nada ou offline placeholder
    });
  });
}

// Estratégia Network-First (tenta rede, se falhar ou demorar, usa cache)
function networkFirst(request) {
  return fetch(request)
    .then((networkResponse) => {
      // Se a resposta for válida, armazena no cache
      if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });
      }
      return networkResponse;
    })
    .catch(() => {
      // Se falhar rede, tenta buscar no cache
      return caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Se for uma navegação de página, retorna uma página offline amigável
        if (request.headers.get('accept').includes('text/html')) {
          return new Response(
            `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Sem Conexão - Método Senda</title>
              <style>
                body {
                  background-color: #1E2538;
                  color: #FFFFFF;
                  font-family: system-ui, -apple-system, sans-serif;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  height: 100vh;
                  margin: 0;
                  text-align: center;
                  padding: 20px;
                }
                h1 { font-size: 24px; margin-bottom: 8px; color: #38BDF8; }
                p { font-size: 16px; color: #94A3B8; max-width: 400px; margin-bottom: 24px; }
                button {
                  background-color: #0EA5E9;
                  color: white;
                  border: none;
                  padding: 12px 24px;
                  font-size: 16px;
                  border-radius: 8px;
                  cursor: pointer;
                  font-weight: 600;
                  transition: background-color 0.2s;
                }
                button:hover { background-color: #0284C7; }
              </style>
            </head>
            <body>
              <h1>Você está offline</h1>
              <p>Parece que você está sem conexão com a internet. Verifique sua rede e tente novamente.</p>
              <button onclick="window.location.reload()">Tentar Novamente</button>
            </body>
            </html>
            `,
            {
              headers: { 'Content-Type': 'text/html; charset=utf-8' },
            }
          );
        }
      });
    });
}
