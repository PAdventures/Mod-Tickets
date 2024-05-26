import { Logger as RecipleLogger, RecipleModuleStartData } from 'reciple';
import { BaseModule } from '../BaseModule.js';

export class Logger extends BaseModule {
    public versions: string | string[] = "^8";

	public logger: RecipleLogger|null|undefined;

	public onStart(data: RecipleModuleStartData): string | boolean | Error | Promise<string | boolean | Error> {
		this.logger = data.client.logger;

		return true;
	}

	public logError(...data: any[]): void {
		if (!this.logger) return;
		this.logger.error(...data);
	}

	public logInfo(...data: any[]): void {
		if (!this.logger) return;
		this.logger.info(...data);
	}

	public logWarning(...data: any[]): void {
		if (!this.logger) return;
		this.logger.warn(...data);
	}

	public logDebug(...data: any[]): void {
		if (!this.logger) return;
		this.logger.debug(...data);
	}

	public logMessage(...data: any[]): void {
		if (!this.logger) return;
		this.logger.log(...data);
	}
}

export default new Logger();