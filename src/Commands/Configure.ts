import { SlashCommandBuilder } from "reciple";
import { BaseModule } from "../BaseModule.js";
import { CategoryChannel, ChannelType, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, TextChannel } from "discord.js";
import MessageUtility from "../Utils/MessageUtility.js";
import { prisma } from "../Prisma.js";
import { TicketCreateType } from "@prisma/client";

export class ConfigureCmd extends BaseModule {
    public versions: string | string[] = "^8";

    public onStart(): string | boolean | Error | Promise<string | boolean | Error> {
        this.commands = [
            new SlashCommandBuilder()
                .setName('configure')
                .setDescription('Manage the configuration data that Mod Tickets will use')
                .addSubcommand(enable => enable
                    .setName('enable-system')
                    .setDescription('If the ticketing system is disabled, you can re-enable it')
                )
                .addSubcommand(disable => disable
                    .setName('disable-system')
                    .setDescription('If the ticketing system is enabled, you can disable it')
                )
                .addSubcommand(system => system
                    .setName('system')
                    .setDescription('The configuration data can been managed here')
                    .addChannelOption(createChannel => createChannel
                        .setName('ticket-create-channel')
                        .setDescription('The text channel where users can create a ticket')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                    )
                    .addChannelOption(parentChannel => parentChannel
                        .setName('ticket-parent-channel')
                        .setDescription('A category channel where ticket channels are made. Not to be confused with `ticket-create-channel`')
                        .addChannelTypes(ChannelType.GuildCategory)
                        .setRequired(true)
                    )
                    .addChannelOption(transcriptsChannel => transcriptsChannel
                        .setName('transcripts-channel')
                        .setDescription('The text channel where a copy of the messages sent in a ticket channel are sent to')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                    )
                    .addStringOption(createType => createType
                        .setName('ticket-create-type')
                        .setDescription('The method Mod Tickets will allow users to use')
                        .addChoices(
                            { name: "Button", value: "button" },
                            { name: "Button + Modal", value: "button-modal" },
                            { name: "Command (Create ticket embed won't be used)", value: "command" },
                            { name: "Command + Modal (Create ticket embed won't be used)", value: "command-modal" }
                        )
                        .setRequired(true)
                    )
                    .addStringOption(embedTitle => embedTitle
                        .setName('embed-title')
                        .setDescription('The title of the embed when the `ticket-create-type` uses on of the button methods')
                        .setMaxLength(256)
                        .setRequired(false)
                    )
                    .addStringOption(embedDescription => embedDescription
                        .setName('embed-description')
                        .setDescription('The description of the embed when the `ticket-create-type` uses on of the button methods')
                        .setMaxLength(2000)
                        .setRequired(false)
                    )
                )
                .setCooldown(2 * 60 * 1000)
                .setDMPermission(false)
                .setRequiredMemberPermissions(PermissionFlagsBits.ManageChannels)
                .setExecute(async ({ interaction }) => {
                    if (!interaction.inCachedGuild()) {
                        await interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(MessageUtility.embedColourError)
                                    .setAuthor({ name: "Error" })
                                    .setDescription(MessageUtility.createErrorMessage(MessageUtility.ErrorMessages.NOT_CACHED_GUILD))
                            ],
                            ephemeral: true,
                        })
                        return;
                    }

                    await interaction.deferReply({ ephemeral: true });

                    switch (interaction.options.getSubcommand(true) as 'system' | 'enable-system' | 'disable-system') {
                        case 'enable-system': {
                            return await this.HandleEnableSystem(interaction as never as ChatInputCommandInteraction<"cached">)
                        }
                        case 'disable-system': {
                            return await this.HandleDisableSystem(interaction as never as ChatInputCommandInteraction<"cached">)
                        }
                        case 'system': {
                            return await this.HandleSystem(interaction as never as ChatInputCommandInteraction<"cached">)
                        }
                    }
                })
        ]

        return true;
    }

    private async HandleEnableSystem(interaction: ChatInputCommandInteraction<"cached">): Promise<void> {
        const ticketConfig = await prisma.ticketConfig.findUnique({ where: { guild_id: interaction.guild.id }});
        if (!ticketConfig) {
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(MessageUtility.embedColourError)
                        .setAuthor({ name: "Error" })
                        .setDescription(`
                        ${MessageUtility.createErrorMessage('The configuration was unable to be fetched from the database.')}

                        ${MessageUtility.createTipMessage('Try running`/configure system` to add configuration data if you never did')}
                        `)
                ]
            })
            return;
        }

        if (ticketConfig.enabled) {
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(MessageUtility.embedColourSuccess)
                        .setAuthor({ name: "Success?" })
                        .setDescription(`
                        ${MessageUtility.createSuccessMessage('Successfully enabled the ticketing system')}

                        😜 Looks like the system was already enabled. But hey, you achieved your goal anyways
                        `)
                ]
            })
            return;
        }

        try {
            await prisma.ticketConfig.update({
                where: { guild_id: interaction.guild.id },
                data: { enabled: true }
            })
        } catch (err) {
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(MessageUtility.embedColourError)
                        .setAuthor({ name: "Error" })
                        .setDescription(MessageUtility.createErrorMessage(MessageUtility.ErrorMessages.DATABASE_ERROR))
                ]
            })
            return;
        }

        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor(MessageUtility.embedColourSuccess)
                    .setAuthor({ name: "Success" })
                    .setDescription(MessageUtility.createSuccessMessage("Successfully enabled the ticketing system"))
            ]
        })
        return;
    }

    private async HandleDisableSystem(interaction: ChatInputCommandInteraction<"cached">): Promise<void> {
        const ticketConfig = await prisma.ticketConfig.findUnique({ where: { guild_id: interaction.guild.id }});
        if (!ticketConfig) {
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(MessageUtility.embedColourError)
                        .setAuthor({ name: "Error" })
                        .setDescription(`
                        ${MessageUtility.createErrorMessage('The configuration was unable to be fetched from the database.')}

                        ${MessageUtility.createTipMessage('Try running`/configure system` to add configuration data if you never did')}
                        `)
                ]
            })
            return;
        }

        if (!ticketConfig.enabled) {
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(MessageUtility.embedColourSuccess)
                        .setAuthor({ name: "Success?" })
                        .setDescription(`
                        ${MessageUtility.createSuccessMessage('Successfully disabled the ticketing system')}

                        😜 Looks like the system was already disabled. But hey, you achieved your goal anyways
                        `)
                ]
            })
            return;
        }

        try {
            await prisma.ticketConfig.update({
                where: { guild_id: interaction.guild.id },
                data: { enabled: false }
            })
        } catch (err) {
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(MessageUtility.embedColourError)
                        .setAuthor({ name: "Error" })
                        .setDescription(MessageUtility.createErrorMessage(MessageUtility.ErrorMessages.DATABASE_ERROR))
                ]
            })
            return;
        }

        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor(MessageUtility.embedColourSuccess)
                    .setAuthor({ name: "Success" })
                    .setDescription(MessageUtility.createSuccessMessage("Successfully disabled the ticketing system"))
            ]
        })
        return;
    }

    private async HandleSystem(interaction: ChatInputCommandInteraction<"cached">): Promise<void> {
        const { options, guild } = interaction;

        const createChannel = options.getChannel('ticket-create-channel', true) as TextChannel
        const parentChannel = options.getChannel('ticket-parent-channel', true) as CategoryChannel
        const transcriptsChannel = options.getChannel('transcripts-channel', true) as TextChannel
        const toResolveCreateType = options.getString('ticket-create-tye', true) as 'button' | 'button-modal' | 'command' | 'command-modal';
        
        const embedTitle = options.getString('embed-title', false);
        const embedDescription = options.getString('embed-description', false);

        const createType = toResolveCreateType.split("-").map(type => `${type.charAt(0).toUpperCase()}${type.substring(1)}`).join("") as TicketCreateType;

        try {
            await prisma.ticketConfig.upsert({
                where: { guild_id: guild.id },
                update: {
                    create_channel_id: createChannel.id,
                    ticket_parent_channel_id: parentChannel.id,
                    transcripts_channel_id: transcriptsChannel.id,

                    ticket_create_type: createType,

                    embed_title: embedTitle,
                    embed_description: embedDescription
                },
                create: {
                    guild_id: guild.id,
                    create_channel_id: createChannel.id,
                    ticket_parent_channel_id: parentChannel.id,
                    transcripts_channel_id: transcriptsChannel.id,

                    ticket_create_type: createType,

                    embed_title: embedTitle,
                    embed_description: embedDescription
                }
            })
        } catch (err) {
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(MessageUtility.embedColourError)
                        .setAuthor({ name: "Error" })
                        .setDescription(MessageUtility.createErrorMessage(MessageUtility.ErrorMessages.DATABASE_ERROR))
                ]
            })
            return;
        }

        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor(MessageUtility.embedColourSuccess)
                    .setAuthor({ name: "Success" })
                    .setDescription(MessageUtility.createSuccessMessage('Successfully sent the configuration data to the database'))
            ]
        })
        return;
    }
}