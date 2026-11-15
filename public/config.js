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
	// Optional SIOnline telemetry — direct calls to vladimirkhil.com often fail without VPN/HAPP
	// and are not required to play. Leave empty for self-hosted / layero / Cloudflare deploys.
	siStatisticsServiceUri: '',
	appRegistryServiceUri: '',
	clearUrls: false,
};

firebaseConfig = null;

onLoad = function () {
	console.log('Svoyak (SIOnline protocol) loaded');
};
