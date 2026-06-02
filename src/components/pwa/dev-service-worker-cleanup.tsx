"use client";

import { useEffect } from "react";

export function DevServiceWorkerCleanup() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const currentVersion = document.body.dataset.appVersion || "";
    const storedVersion = window.localStorage.getItem("amysa-app-version") || "";
    const isDevelopment = process.env.NODE_ENV === "development";

    if (!currentVersion) {
      return;
    }

    if (!isDevelopment && currentVersion === storedVersion) {
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
          window.localStorage.setItem("amysa-app-version", currentVersion);
          window.location.reload();
        });
      })
      .catch(() => {
        // No bloquear la app si el navegador no permite el cleanup.
      });
  }, []);

  return null;
}
