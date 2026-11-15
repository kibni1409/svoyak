/* Unregisters any leftover service workers from earlier PWA builds. */
if ('serviceWorker' in navigator) {
	navigator.serviceWorker.getRegistrations().then((regs) => {
		regs.forEach((reg) => reg.unregister());
	});
	if (window.caches && caches.keys) {
		caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
	}
}
