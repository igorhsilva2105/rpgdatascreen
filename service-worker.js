// RPG Console Pro - Service Worker
// Versão: 3.0.0
// Cache: rpg-console-pro-v3

const CACHE_NAME = 'rpg-console-pro-v3';
const OFFLINE_URL = 'offline.html';

// Assets para cache imediato
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/offline.html',
  '/manifest.json',
  
  // Ícones
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
  
  // Fontes
  'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  
  // Sons
  '/sounds/dice-roll.mp3',
  '/sounds/click.mp3'
];

// Instalação do Service Worker
self.addEventListener('install', event => {
  console.log('🛠️ Service Worker: Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Service Worker: Cacheando recursos críticos');
        return cache.addAll(PRECACHE_ASSETS)
          .then(() => {
            console.log('✅ Service Worker: Instalação completa');
            return self.skipWaiting();
          })
          .catch(error => {
            console.error('❌ Service Worker: Erro ao cachear:', error);
          });
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', event => {
  console.log('⚡ Service Worker: Ativando...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Limpar caches antigos
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Service Worker: Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker: Ativação completa');
      return self.clients.claim();
    })
  );
});

// Estratégia: Cache First, depois Network
self.addEventListener('fetch', event => {
  // Ignorar requisições que não são GET
  if (event.request.method !== 'GET') return;
  
  // Ignorar requisições de extensões do Chrome
  if (event.request.url.startsWith('chrome-extension://')) return;
  
  const requestUrl = new URL(event.request.url);
  
  // Para a página principal, usar estratégia Network First
  if (requestUrl.origin === location.origin && requestUrl.pathname === '/') {
    event.respondWith(networkFirstStrategy(event.request));
    return;
  }
  
  // Para arquivos estáticos, usar Cache First
  if (isStaticAsset(event.request)) {
    event.respondWith(cacheFirstStrategy(event.request));
    return;
  }
  
  // Para API requests, usar Network First
  if (isApiRequest(event.request)) {
    event.respondWith(networkFirstStrategy(event.request));
    return;
  }
  
  // Padrão: Network First
  event.respondWith(networkFirstStrategy(event.request));
});

// Estratégia: Cache First
async function cacheFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Log para debug
    console.log('💾 Cache First: Servindo do cache:', request.url);
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    // Clone a resposta para cache
    const responseToCache = networkResponse.clone();
    
    // Cachear apenas respostas válidas
    if (networkResponse.status === 200) {
      cache.put(request, responseToCache);
    }
    
    return networkResponse;
  } catch (error) {
    // Se offline e é uma página, mostrar página offline
    if (request.headers.get('Accept').includes('text/html')) {
      return caches.match(OFFLINE_URL);
    }
    
    throw error;
  }
}

// Estratégia: Network First
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Atualizar cache com nova resposta
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());
    
    return networkResponse;
  } catch (error) {
    // Se offline, tentar servir do cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('📡 Network First: Servindo do cache (offline):', request.url);
      return cachedResponse;
    }
    
    // Se for uma página e não tem cache, mostrar offline page
    if (request.headers.get('Accept').includes('text/html')) {
      return caches.match(OFFLINE_URL);
    }
    
    throw error;
  }
}

// Verificar se é um arquivo estático
function isStaticAsset(request) {
  const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ttf', '.mp3', '.wav'];
  const url = new URL(request.url);
  
  return staticExtensions.some(ext => url.pathname.endsWith(ext));
}

// Verificar se é uma requisição de API
function isApiRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/');
}

// Background Sync para dados offline
self.addEventListener('sync', event => {
  if (event.tag === 'sync-fichas') {
    console.log('🔄 Service Worker: Sincronizando fichas offline...');
    event.waitUntil(syncFichas());
  }
});

async function syncFichas() {
  // Aqui você implementaria a sincronização de dados offline
  // Por exemplo, enviar fichas criadas offline para o servidor
  console.log('📤 Sincronizando dados offline...');
}

// Push Notifications
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'Nova notificação do RPG Console Pro',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now()
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir App'
      },
      {
        action: 'close',
        title: 'Fechar'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'RPG Console Pro', options)
  );
});

// Clique em notificação
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(windowClients => {
        for (const client of windowClients) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Atualização periódica do Service Worker
self.addEventListener('periodicsync', event => {
  if (event.tag === 'update-content') {
    console.log('🔄 Service Worker: Atualização periódica...');
    event.waitUntil(updateContent());
  }
});

async function updateContent() {
  // Aqui você atualizaria conteúdo em segundo plano
  console.log('📥 Verificando atualizações...');
}

// Mensagens do cliente para o Service Worker
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CACHE_ASSETS') {
    // Cachear recursos adicionais
    caches.open(CACHE_NAME).then(cache => {
      cache.addAll(event.data.assets);
    });
  }
  
  if (event.data && event.data.type === 'GET_CACHE_INFO') {
    // Retornar informações do cache
    caches.open(CACHE_NAME).then(cache => {
      cache.keys().then(keys => {
        event.ports[0].postMessage({
          type: 'CACHE_INFO',
          count: keys.length,
          size: '...'
        });
      });
    });
  }
});

// Prefetch de recursos
self.addEventListener('fetch', event => {
  if (event.request.url.includes('prefetch')) {
    // Implementar prefetch inteligente
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(event.request).then(response => {
          const fetchPromise = fetch(event.request).then(networkResponse => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
          
          return response || fetchPromise;
        });
      })
    );
  }
});
