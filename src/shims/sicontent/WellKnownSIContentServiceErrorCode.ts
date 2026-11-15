enum WellKnownSIContentServiceErrorCode {
	BadPackageFile = 0,
	StorageFull = 1,
	FileEmpty = 2,
	FileTooLarge = 3,
	MultipartContentTypeRequired = 4,
	ContentLengthHeaderRequired = 5,
	ContentDispositionHeaderRequired = 6,
	DispositionNameRequired = 7,
	DispositionFileNameRequired = 8,
	ContentMD5HeaderRequired = 9,
}

export default WellKnownSIContentServiceErrorCode
