export interface IFileUploadService {
	uploadFile(
		file: Buffer,
		filename: string,
		mimeType: string,
	): Promise<{
		url: string;
		key: string;
		bucket: string;
	}>;
	deleteFile(key: string): Promise<boolean>;
	getSignedUrl(key: string, expiresIn?: number): Promise<string>;
}
