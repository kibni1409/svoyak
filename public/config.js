config = {
	// Through Vite/nginx same-origin proxy (CORS workaround). Upstream is vladimirkhil.com.
	serverDiscoveryUri: '/si/discovery',
	rootUri: '/',
	ads: '<b></b>',
	rewriteUrl: true,
	forceHttps: false,
	registerServiceWorker: false,
	enableNoSleep: true,
	askForConsent: false,
	siStatisticsServiceUri: 'https://vladimirkhil.com/sistatistics',
	appRegistryServiceUri: 'https://vladimirkhil.com/appregistry',
	clearUrls: false,
};

firebaseConfig = null;

onLoad = function () {
	console.log('Svoyak (SIOnline protocol) loaded');
};
