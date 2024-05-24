import { Logger as RecipleLogger, RecipleModuleStartData } from 'reciple';
import { BaseModule } from '../BaseModule.js';

export class Logger extends BaseModule {
    public versions: string | string[] = "^8";

	public logger: RecipleLogger|null|undefined;

	public onStart(data: RecipleModuleStartData): string | boolean | Error | Promise<string | boolean | Error> {
		this.logger = data.client.logger;

		return true;
	}

	public logError(message: string): void {
		if (!this.logger) return;
		this.logger.error(message);
	}

	public logInfo(message: string): void {
		if (!this.logger) return;
		this.logger.info(message);
	}

	public logWarning(message: string): void {
		if (!this.logger) return;
		this.logger.warn(message);
	}

	public logDebug(message: string): void {
		if (!this.logger) return;
		this.logger.debug(message);
	}

	public logMessage(message: string): void {
		if (!this.logger) return;
		this.logger.log(message);
	}
}

export default new Logger();