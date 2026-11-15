export default class SIStorageServiceError extends Error {
	errorCode?: number
	statusCode: number

	constructor(message: string | undefined, statusCode: number, errorCode?: number) {
		super(message)
		this.statusCode = statusCode
		this.errorCode = errorCode
	}
}
