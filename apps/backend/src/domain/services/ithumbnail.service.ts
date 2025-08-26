export interface IThumbnailService {
	generateThumbnails(videoBuffer: Buffer, filename: string, mimeType: string): Promise<string[]>;
}
