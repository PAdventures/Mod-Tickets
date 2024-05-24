import { AnyCommandResolvable, RecipleModuleLoadData, RecipleModuleStartData, RecipleModuleUnloadData } from 'reciple';
import { RecipleInteractionListenerModule, AnyInteractionListener } from 'reciple-interaction-events';

export abstract class BaseModule implements RecipleInteractionListenerModule {
	public versions: string | string[] = '^8';
	public commands: AnyCommandResolvable[] = [];
	public devCommands: AnyCommandResolvable[] = [];
	public interactionListeners: AnyInteractionListener[] = [];
    
    public abstract onStart(data: RecipleModuleStartData): string | boolean | Error | Promise<string | boolean | Error>;

    public onLoad(data: RecipleModuleLoadData): string | void | Error | Promise<string | void | Error> {}
    public onUnload(data: RecipleModuleUnloadData): string | void | Error | Promise<string | void | Error> {}
}