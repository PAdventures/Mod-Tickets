import { ColorResolvable, inlineCode } from "discord.js";
import { BaseModule } from "../BaseModule.js";

export class MessageUtility extends BaseModule {
    public versions: string | string[] = "^8";

    public onStart(): string | boolean | Error | Promise<string | boolean | Error> {
        return true;
    }

    public embedColourDefault: ColorResolvable = "Blurple";
    public embedColourError: ColorResolvable = "Red";
    public embedColourWarning: ColorResolvable = "Orange";
    public embedColourSuccess: ColorResolvable = "Green";

    public defaultErrorEmoji: string = '❌';
	public defaultWarningEmoji: string = '⚠️';
	public defaultSuccessEmoji: string = '✅';
	public defaultTipEmoji: string = '💡';
	public defaultQuestionEmoji: string = '❓';
	public defaultInfoEmoji: string = 'ℹ️';

	public createErrorMessage(message: string): string {
		return this.createLabel(message, this.defaultErrorEmoji);
	}

	public createWarningMessage(message: string): string {
		return this.createLabel(message, this.defaultWarningEmoji, true);
	}

	public createSuccessMessage(message: string): string {
		return this.createLabel(message, this.defaultSuccessEmoji);
	}

	public createTipMessage(message: string): string {
		return this.createLabel(message, this.defaultTipEmoji);
	}

	public createQuestionMessage(message: string): string {
		return this.createLabel(message, this.defaultQuestionEmoji);
	}

	public createInfoMessage(message: string): string {
		return this.createLabel(message, this.defaultInfoEmoji);
	}

	public createLabel(message: string, emoji: string, noInline: boolean = false): string {
		return `${noInline ? `${emoji}` : inlineCode(emoji)} ${message}`;
	}
}

export default new MessageUtility();