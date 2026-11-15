import GameInfo from './contracts/GameInfo';
import HostInfo from './contracts/HostInfo';
import Slice from './contracts/Slice';
import IGameServerClient from './IGameServerClient';
import RunGameResponse from './contracts/RunGameResponse';
import RunGameRequest from './contracts/RunGameRequest';
import RunAutoGameRequest from './contracts/RunAutoGameRequest';
import GetGameByPinResponse from './contracts/GetGameByPinResponse';
import * as signalR from '@microsoft/signalr';
import * as signalRMsgPack from '@microsoft/signalr-protocol-msgpack';
import StorageFilter from './contracts/StorageFilter';
import IGameServerListener from './IGameServerListener';
import { preferHttpStreamingTransports, preferLongPollingOnly } from '../utils/siProxy';
import { nextSignalRRetryDelay } from '../utils/signalRReconnect';
import { fetchJson, HttpJsonError } from '../utils/fetchJson';

function signalRTransport(): signalR.HttpTransportType {
	if (preferLongPollingOnly()) {
		return signalR.HttpTransportType.LongPolling;
	}

	if (preferHttpStreamingTransports()) {
		// Layero: no WS — SSE uses far fewer HTTP calls than LongPolling.
		return signalR.HttpTransportType.ServerSentEvents | signalR.HttpTransportType.LongPolling;
	}

	return signalR.HttpTransportType.WebSockets
		| signalR.HttpTransportType.ServerSentEvents
		| signalR.HttpTransportType.LongPolling;
}

/** Represents a connection to a SIGame Server. */
export default class GameServerClient implements IGameServerClient {
	private isDisconnecting = false;

	/** Underlying SignalR connection. */
	private connection?: signalR.HubConnection;

	/**
	 * Initializes a new instance of {@link GameServerClient}.
	 */
	constructor(private serverUri: string) { }

	setServerUri(uri: string): void {
		this.serverUri = uri;
	}

	isConnected(): boolean {
		return this.connection?.state === signalR.HubConnectionState.Connected;
	}

	async connect(runtimeUri: string, listener: IGameServerListener): Promise<void> {
		const connectionBuilder = new signalR.HubConnectionBuilder()
			.withAutomaticReconnect({
				nextRetryDelayInMilliseconds: nextSignalRRetryDelay,
			})
			.withUrl(`${runtimeUri}/sionline`, {
				transport: signalRTransport(),
			})
			.withHubProtocol(new signalRMsgPack.MessagePackHubProtocol())
			.withServerTimeout(60000)
			.withKeepAliveInterval(15000);

		this.connection = connectionBuilder.build();

		this.connection.on('GameCreated', listener.onGameCreated.bind(listener));
		this.connection.on('GameChanged', listener.onGameChanged.bind(listener));
		this.connection.on('GameDeleted', listener.onGameDeleted.bind(listener));

		this.connection.onreconnecting(e => {
			if (this.isDisconnecting) {
				return;
			}

			listener.onReconnecting(e);
		});

		this.connection.onreconnected(() => {
			if (this.isDisconnecting) {
				return;
			}

			listener.onReconnected();
		});

		this.connection.onclose(async e => {
			if (this.isDisconnecting) {
				return;
			}

			listener.onClose(e);

			if (e) {
				try {
					await this.connection?.start();
					listener.onReconnected();
				} catch (error) {
					console.error('Error while restarting connection: ' + error);
				}
			}
		});

		const startPromise = this.connection.start();
		const timeoutPromise = new Promise<never>((_, reject) => {
			window.setTimeout(() => reject(new Error('SignalR connection timeout')), 25000);
		});

		try {
			await Promise.race([startPromise, timeoutPromise]);
		} catch (e) {
			try {
				await this.connection.stop();
			} catch {
				// ignore
			}
			this.connection = undefined;
			throw e;
		}
	}

	async disconnect(): Promise<void> {
		if (!this.connection) {
			return;
		}

		this.connection.off('GameCreated');
		this.connection.off('GameChanged');
		this.connection.off('GameDeleted');

		this.isDisconnecting = true;

		try {
			await this.connection.stop();
		} finally {
			this.isDisconnecting = false;
		}

		this.connection = undefined;
	}

	async getComputerAccountsAsync(culture: string): Promise<string[]> {
		try {
			return await fetchJson<string[]>(`${this.serverUri}/api/v1/info/bots`, {
				headers: {
					'Accept-Language': culture
				}
			});
		} catch (error) {
			throw new Error(`Error while retrieving computer accounts: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	async getGameHostInfoAsync(culture: string): Promise<HostInfo> {
		try {
			return await fetchJson<HostInfo>(`${this.serverUri}/api/v1/info/host`, {
				headers: {
					'Accept-Language': culture
				}
			});
		} catch (error) {
			throw new Error(`Error while retrieving host info: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	async getStorageFilterAsync(storageId: string): Promise<StorageFilter> {
		try {
			return await fetchJson<StorageFilter>(`${this.serverUri}/api/v1/info/storage-filter/${storageId}`);
		} catch {
			return { packages: {}, tags: [] };
		}
	}

	getGamesSliceAsync(fromId: number): Promise<Slice<GameInfo>> {
		if (!this.connection) {
			return Promise.reject(new Error('Not connected to the server'));
		}

		return this.connection.invoke<Slice<GameInfo>>('GetGamesSlice', fromId);
	}

	async runGameAsync(runGameRequest: RunGameRequest): Promise<RunGameResponse> {
		return fetchJson<RunGameResponse>(`${this.serverUri}/api/v1/games`, {
			method: 'POST',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(runGameRequest)
		});
	}

	async runAutoGameAsync(runAutoGameRequest: RunAutoGameRequest): Promise<RunGameResponse> {
		return fetchJson<RunGameResponse>(`${this.serverUri}/api/v1/games/auto`, {
			method: 'POST',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(runAutoGameRequest)
		});
	}

	async getGameByPinAsync(pin: number): Promise<GetGameByPinResponse | null> {
		try {
			return await fetchJson<GetGameByPinResponse>(`${this.serverUri}/api/v1/games?pin=${pin}`);
		} catch (error) {
			if (error instanceof HttpJsonError && error.status === 404) {
				return null;
			}

			const message = error instanceof Error ? error.message : String(error);
			throw new Error(`Error while retrieving game by pin: ${message}`);
		}
	}
}
