import { ActionRowBuilder, ButtonInteraction, ChannelType, ChatInputCommandInteraction, ContextMenuCommandInteraction, ModalBuilder, ModalSubmitInteraction, PermissionFlagsBits, TextChannel, TextInputBuilder, TextInputStyle } from "discord.js";
import { BaseModule } from "../BaseModule.js";
import Logger from "./Logger.js";
import { TicketConfig } from "@prisma/client";

type ValidInteraction = ChatInputCommandInteraction | ContextMenuCommandInteraction | ButtonInteraction;
type CachedValidInteraction = ChatInputCommandInteraction<"cached"> | ButtonInteraction<"cached"> | ContextMenuCommandInteraction<"cached">;

export class Helper extends BaseModule {
    public versions: string | string[] = "^8";

    public onStart(): string | boolean | Error | Promise<string | boolean | Error> {
        return true;
    }

    public async ShowCreateTicketModal(interaction: ValidInteraction): Promise<void> {
        const createTicketModal = new ModalBuilder()
            .setCustomId('ticket-create-modal')
            .setTitle('Create a Ticket')
            .addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(
                    new TextInputBuilder()
                        .setCustomId('ticketTopic')
                        .setLabel('What is the Topic of your support?')
                        .setPlaceholder('Enter ticket topic/title...')
                        .setMaxLength(256)
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                ),
                new ActionRowBuilder<TextInputBuilder>().addComponents(
                    new TextInputBuilder()
                        .setCustomId('ticketDescription')
                        .setLabel('Please describe you issue/reason for the support')
                        .setPlaceholder('Enter ticket description...')
                        .setMaxLength(1024)
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(true)
                ),
                new ActionRowBuilder<TextInputBuilder>().addComponents(
                    new TextInputBuilder()
                        .setCustomId('ticketExtraNotes')
                        .setLabel('Please provide any additional information if applicable')
                        .setPlaceholder('Enter additional info...')
                        .setMaxLength(1024)
                        .setStyle(TextInputStyle.Paragraph)
                        .setValue('No additional information')
                        .setRequired(false)
                )
            )

        try {
            await interaction.showModal(createTicketModal)
        } catch (err) {
            Logger.logError(err)
            return;
        }
    }

    public generateTicketId(): string {
        let ticketId = Math.floor(Math.random() * 9999).toString();
        const zerosNeeded = 4 - ticketId.length;
        for (let index = zerosNeeded; index > 0; index--) {
            ticketId = "0" + ticketId
        }
        return ticketId;
    }

    public async CreateTicketChannel(interaction: CachedValidInteraction | ModalSubmitInteraction<"cached">, ticketConfig: TicketConfig, ticketId: string): Promise<TextChannel> {
        return await interaction.guild.channels.create({
            name: `${interaction.user.username}-ticket-${ticketId}`,
            parent: ticketConfig.ticket_parent_channel_id,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                {
                    id: interaction.guild.roles.everyone.id,
                    deny: PermissionFlagsBits.ViewChannel
                },
                {
                    id: interaction.member.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
                }
            ]
        });
    }
}

export default new Helper();