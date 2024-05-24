import { ContextMenuCommandBuilder, RecipleModuleLoadData, SlashCommandBuilder, SlashCommandBuilderNonSubcommandAddOptionMethods, SlashCommandBuilderSubcommandAddOptionMethods } from "reciple";
import { BaseModule } from "../BaseModule.js";
import { ApplicationCommandType, EmbedBuilder } from "discord.js";
import MessageUtility from "../Utils/MessageUtility.js";

export class HelpCmd extends BaseModule {
    public versions: string | string[] = "^8";

    private commandData: (Omit<SlashCommandBuilder, SlashCommandBuilderNonSubcommandAddOptionMethods> | Omit<SlashCommandBuilder, SlashCommandBuilderSubcommandAddOptionMethods> | ContextMenuCommandBuilder)[] = [];

    public onLoad(data: RecipleModuleLoadData): string | void | Error | Promise<string | void | Error> {
        const client = data.client;

        client.modules.on("loadedModules", () => {
            const commands = [
                ...client.commands.contextMenuCommands.values(),
                ...client.commands.slashCommands.values(),
            ]

            this.commandData = commands
        });
    }

    public onStart(): string | boolean | Error | Promise<string | boolean | Error> {
        this.commands = [
            new SlashCommandBuilder()
                .setName('help')
                .setDescription('Shows all commands available with their respective description')
                .setCooldown(1 * 60 * 1000)
                .setDMPermission(true)
                .setExecute(async ({ interaction}) => {
                    await interaction.deferReply({ ephemeral: true })

                    if (this.commandData.length === 0) {
                        await interaction.editReply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(MessageUtility.embedColourError)
                                    .setAuthor({ name: "Error" })
                                    .setDescription(MessageUtility.createErrorMessage('Command data hasn\'t been fully crunched yet. Please try again later'))
                                    .setTimestamp()
                            ]
                        })
                    }

                    const slashCommands = this.commandData.filter(anyCmd => anyCmd.isSlashCommand()) as SlashCommandBuilder[]
                    const contextMenuCommands = this.commandData.filter(anyCmd => anyCmd.isContextMenuCommand()) as ContextMenuCommandBuilder[]

                    const slashCommandEmbed = new EmbedBuilder()
                        .setColor(MessageUtility.embedColourDefault)
                        .setAuthor({ name: "Slash Commands" })
                        .setDescription(`
                        All of Mod Ticket\'s slash commands are listed below!

                        **Key**
                        \`DM\` --> Command can be used in DMs
                        ⏳ --> Command has a cooldown
                        👨‍💼 --> Command needs permissions you don't have
                        `)
                        .addFields(
                            slashCommands.map(slashCmd => {
                                const commandTags: ('`DM`' | '⏳' | '👨‍💼')[] = []
                                if (slashCmd.dm_permission) {
                                    commandTags.push("`DM`")
                                }
                                if (slashCmd.cooldown) {
                                    commandTags.push('⏳')
                                }
                                if (interaction.memberPermissions && interaction.memberPermissions?.missing(slashCmd.required_member_permissions ?? BigInt(0)).length > 0) {
                                    commandTags.push('👨‍💼')
                                }
                                return {
                                    name: `/${slashCmd.name} ${commandTags.join(" ")}`,
                                    value: `${slashCmd.description}`,
                                    inline: true
                                }
                            })
                        )
                        .setTimestamp()

                    const contextMenuCommandEmbed = new EmbedBuilder()
                        .setColor(MessageUtility.embedColourDefault)
                        .setAuthor({ name: "Context Menu Commands" })
                        .setDescription(`
                        All of Mod Ticket\'s context menu commands are listed below!

                        **Key**
                        \`DM\` --> Command can be used in DMs
                        ⏳ --> Command has a cooldown
                        👨‍💼 --> Command needs permissions you don't have
                        👤 --> User context menu
                        💬 --> Message context menu
                        `)
                        .addFields(
                            contextMenuCommands.map(contextMenuCmd => {
                                const commandTags: ('`DM`' | '⏳' | '👨‍💼' | '👤' | '💬')[] = []
                                if (contextMenuCmd.dm_permission) {
                                    commandTags.push("`DM`")
                                }
                                if (contextMenuCmd.cooldown) {
                                    commandTags.push('⏳')
                                }
                                if (interaction.memberPermissions && interaction.memberPermissions?.missing(contextMenuCmd.required_member_permissions ?? BigInt(0)).length > 0) {
                                    commandTags.push('👨‍💼')
                                }
                                if (contextMenuCmd.type === ApplicationCommandType.User) {
                                    commandTags.push("👤")
                                }
                                else {
                                    commandTags.push("💬")
                                }
                                return {
                                    name: `${contextMenuCmd.name} ${commandTags.join(" ")}`,
                                    value: "None",
                                    inline: true
                                }
                            })
                        )
                    
                    await interaction.editReply({
                        embeds: [
                            slashCommandEmbed,
                            contextMenuCommandEmbed
                        ]
                    })
                }),
        ]

        return true;
    }
}

export default new HelpCmd();