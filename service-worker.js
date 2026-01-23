/* ==============================
   CB SYSTEMS® - SERVICE WORKER
   ============================== */

const CACHE_NAME = "cb-systems-v1";

/* Arquivos essenciais do app */
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",

  /* Páginas principais */
  "/home.html",
  "/dashboard.html",
  "/fichatecnica.html",
  "/analiseficha.html",
  "/consultaproduto.html",

  /* Cards */
  "/cards/card1.html",
  "/cards/card2.html",
  "/cards/card3.html",
  "/cards/card4.html",
  "/cards/card5.html",

  /* APIs internas (cache apenas GET) */
  "/api/produto-preco/id.js",
  "/api/produto-preco/produto.js",
  "/api/produto-preco/produto-detalhe.js",
  "/api/produto-preco/produto-completo.js",
  "/api/produto-preco/buscar-id.js",
  "/api/produto-preco/buscar-barcode.js",
  "/api/produto-preco/produtos-busca.js",
  "/api/produto-preco/vendas-produto.js",

  /* Fontes externas */
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap",
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
];

/* ==============================
   INSTALL
   ============================== */
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CORE_ASSETS);
    })
  );
  self.skipWaiting();
});

/* ==============================
   ACTIVATE
   ============================== */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

/* ==============================
   FETCH
   Estratégia:
   - Cache First (HTML, CSS, JS)
   - Network First (API Supabase)
   ============================== */
self.addEventListener("fetch", event => {

  const req = event.request;

  /* Ignora métodos que não sejam GET */
  if (req.method !== "GET") return;

  /* Supabase sempre online */
  if (req.url.includes("supabase.co")) {
    event.respondWith(
      fetch(req).catch(() => caches.match(req))
    );
    return;
  }

  /* Estratégia padrão */
  event.respondWith(
    caches.match(req).then(cacheRes => {
      return (
        cacheRes ||
        fetch(req).then(fetchRes => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(req, fetchRes.clone());
            return fetchRes;
          });
        })
      );
    }).catch(() => {
      /* fallback offline */
      if (req.destination === "document") {
        return caches.match("/index.html");
      }
    })
  );
});
