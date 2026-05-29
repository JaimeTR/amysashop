"use client";

import { useEffect } from "react";

export function DevServiceWorkerCleanup() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    Promise.all([navigator.serviceWorker.getRegistrations(), caches.keys()])
      .then(([registrations, cacheNames]) => {
        const hasRegistrations = registrations.length > 0;
        const hasCaches = cacheNames.length > 0;

        if (!hasRegistrations && !hasCaches) {
          return;
        }

        return Promise.all([
          Promise.all(registrations.map((registration) => registration.unregister())),
          Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName))),
        ]).then(() => {
          window.location.reload();
        });
      })
      .catch(() => {
        // No bloquear la app si el navegador no permite el cleanup.
      });
  }, []);

  return null;
}
