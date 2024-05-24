import { AnyCommandBuilder, AnyCommandHaltData, CommandHaltReason, CommandPermissionsPrecondition, CommandPermissionsPreconditionTriggerDataType, CommandType, RecipleModuleLoadData, RecipleModuleStartData } from "reciple";
import { BaseModule } from "../BaseModule.js";
import { codeBlock, EmbedBuilder, inlineCode, InteractionReplyOptions, MessageCreateOptions, MessagePayload, PermissionsBitField, time, TimestampStyles } from "discord.js";
import MessageUtility from "./MessageUtility.js";
import LogUtility from "./Logger.js";

export class AddCommandHalt extends BaseModule {
    public versions: string | string[] = "^8";

    public onStart(): string | boolean | Error | Promise<string | boolean | Error> {
        return true
    }

    public onLoad(data: RecipleModuleLoadData): string | void | Error | Promise<string | void | Error> {
        const client = data.client;

        client.modules.on("loadedModules", async () => {
            const commands = [
                ...client.commands.contextMenuCommands.values(),
                ...client.commands.messageCommands.values(),
                ...client.commands.slashCommands.values(),
            ]
            await this.AddHaltToCommands(commands)
        })
    }

    private async AddHaltToCommands(commands: AnyCommandBuilder[]) {
        for (const command of commands) {
            const initialHalt = command.halt;

            const newHalt = async (haltData: AnyCommandHaltData) => {
                const handled = initialHalt ? await initialHalt(haltData as never) : false;
                if (handled) {
                    return true;
                }
                return this.HandleCommandHalt(haltData)
            }

            command.setHalt(newHalt);
        }
    }

    private async HandleCommandHalt(haltData: AnyCommandHaltData): Promise<boolean> {
        const haltReason = haltData.reason;
        switch (haltReason) {
            case CommandHaltReason.Cooldown: {
                const timestamp = time(new Date(haltData.cooldown.endsAt), TimestampStyles.RelativeTime)
                const cooldownEmbed = new EmbedBuilder()
                    .setColor(MessageUtility.embedColourDefault)
                    .setAuthor({ name: 'Cooldown Active' })
                    .setDescription(`You are on an active cooldown. You may re-use this command ${timestamp}`)
                await this.HandleCommandResponse(haltData, cooldownEmbed)
                return true;
            }
            case CommandHaltReason.InvalidArguments: {
                const invalidArgs = haltData.invalidOptions.map(op => inlineCode(op.name));
                const invalidArgsEmbed = new EmbedBuilder()
                    .setColor(MessageUtility.embedColourError)
                    .setAuthor({ name: 'Invalid Arguments' })
                    .setDescription(`Invalid value given to option(s): ${invalidArgs.join(' ')}`);

                await this.HandleCommandResponse(haltData, invalidArgsEmbed);
                return true;
            }
            case CommandHaltReason.MissingArguments: {
                const missingArgs = haltData.missingOptions.map(op => inlineCode(op.name));
                const missingArgsEmbed = new EmbedBuilder()
                    .setColor(MessageUtility.embedColourError)
                    .setAuthor({ name: 'Invalid Arguments' })
                    .setDescription(`Missing required argument(s): ${missingArgs.join(' ')}`);

                await this.HandleCommandResponse(haltData, missingArgsEmbed);
                return true;
            }
            case CommandHaltReason.Error: {
                const commandHaltError = haltData.error;
                const commandHaltErrorEmbed = new EmbedBuilder()
                    .setColor(MessageUtility.embedColourError)
                    .setAuthor({ name: 'Error' })
                    .setDescription(codeBlock('ts', commandHaltError));
                await this.HandleCommandResponse(haltData, commandHaltErrorEmbed);
                return true;
            }
            case CommandHaltReason.PreconditionTrigger: {
                if (CommandPermissionsPrecondition.isPermissionsPreconditionData(haltData)) {
                    const permissionPreconditionType: CommandPermissionsPreconditionTriggerDataType = haltData.data.data.type;
                    switch (permissionPreconditionType) {
                        case CommandPermissionsPreconditionTriggerDataType.BotNotAllowed: {
                            const noBotPermissionEmbed = new EmbedBuilder()
                                .setColor(MessageUtility.embedColourError)
                                .setAuthor({ name: 'No Bot Permission' })
                                .setDescription('Bots are not allowed to execute this command');
                            await this.HandleCommandResponse(haltData, noBotPermissionEmbed);
                            return true;

                        }
                        case CommandPermissionsPreconditionTriggerDataType.NoDmPermission: {
                            const noDmAllowedEmbed = new EmbedBuilder()
                                .setColor(MessageUtility.embedColourWarning)
                                .setAuthor({ name: 'No DM Access' })
                                .setDescription('You are not allowed to use this command in DMs and must be executed in a server');
                            await this.HandleCommandResponse(haltData, noDmAllowedEmbed);
                            return true;
                        }
                        case CommandPermissionsPreconditionTriggerDataType.ClientNotEnoughPermissions: {
                            const missingPermissions: PermissionsBitField = haltData.data.data.requiredPermissions;
                            const missingPermissionsArray = missingPermissions.toArray();
                            const botNotEnoughPermissionsEmbed = new EmbedBuilder()
                                .setColor(MessageUtility.embedColourError)
                                .setAuthor({ name: 'Mod Tickets Missing Permissions' })
                                .setDescription([
                                    MessageUtility.createErrorMessage('Mod Tickets is missing the required permissions to execute this command'),
                                    MessageUtility.createWarningMessage(`Missing permissions \`${missingPermissionsArray.map(perm => inlineCode(perm)).join(' ')}\``),
                                    MessageUtility.createInfoMessage('Contact the server staff or developer if this issue persists')
                                ].join('\n')
                                );
                            await this.HandleCommandResponse(haltData, botNotEnoughPermissionsEmbed);
                            return true;
                        }
                        case CommandPermissionsPreconditionTriggerDataType.MemberNotEnoughPermissions: {
                            const missingPermissions: PermissionsBitField = haltData.data.data.requiredPermissions;
                            const missingPermissionsArray = missingPermissions.toArray();
                            const memberNotEnoughPermissionsEmbed = new EmbedBuilder()
                                .setColor(MessageUtility.embedColourError)
                                .setAuthor({ name: 'Missing Permissions' })
                                .setDescription([
                                    MessageUtility.createErrorMessage('You are missing the required permissions to execute this command'),
                                    MessageUtility.createWarningMessage(`Missing permissions \`${missingPermissionsArray.map(perm => inlineCode(perm)).join(' ')}\``),
                                    MessageUtility.createInfoMessage('Contact the server staff or developer if you think this is a mistake')
                                ].join('\n')
                                );
                            await this.HandleCommandResponse(haltData, memberNotEnoughPermissionsEmbed);
                            return true;
                        }
                    }
                }
                return true;
            }
        }
    } 

    private async HandleCommandResponse(haltData: AnyCommandHaltData, embed: EmbedBuilder): Promise<void> {
        const commandType = haltData.commandType;
        switch (commandType) {
            case CommandType.ContextMenuCommand:
            case CommandType.SlashCommand: {
                try {
                    await haltData.executeData.interaction.reply({ embeds: [embed], ephemeral: true })
                } catch (err) {
                    LogUtility.logError(`[HALT FAILURE] Failed to reply to interaction at ${commandType === CommandType.SlashCommand ?`slash command: /` : 'content command: '}${haltData.executeData.builder.name} for ${haltData.reason.toString()} halt`)
                }
                return;
            }
            default: {
                if (commandType === CommandType.MessageCommand) {
                    try {
                        await haltData.executeData.message.channel.send({ embeds: [embed] })
                    } catch (err) {
                        LogUtility.logError(`[HALT FAILURE] Failed to reply to a message at message command: ${haltData.executeData.builder.name} for ${haltData.reason} halt`)
                    }
                }
                else {
                    LogUtility.logError('[CRITICAL HALT FAILURE] switch-case defaulted')
                }
            }
        }
    }
}

export default new AddCommandHalt();