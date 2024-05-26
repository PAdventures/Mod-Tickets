import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, CacheType, channelMention, ChannelType, EmbedBuilder, ModalBuilder, PermissionFlagsBits, TextInputBuilder, TextInputStyle } from "discord.js";
import { BaseModule } from "../../BaseModule.js";
import MessageUtility from "../../Utils/MessageUtility.js";
import { prisma } from "../../Prisma.js";
import { InteractionListenerType } from "reciple-interaction-events";
import Helper from "../../Utils/Helper.js";

export class TicketCreateBtn extends BaseModule {
    public versions: string | string[] = "^8";

    public onStart(): string | boolean | Error | Promise<string | boolean | Error> {
        this.interactionListeners = [
            {
                type: InteractionListenerType.Button,
                customId: 'ticket-create-button',
                // FIXME - Add a system to add halts to interaction listeners
                // cooldown: 5 * 60 * 1000,
                requiredBotPermissions: PermissionFlagsBits.ManageChannels,
                execute: async (interaction) => {
                    return await this.HandleExecute(interaction as never as ButtonInteraction<CacheType>);
                }
            }
        ]
        return true;
    }

    public async HandleExecute(interaction: ButtonInteraction<CacheType>): Promise<void> {
        if (!interaction.inCachedGuild()) {
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(MessageUtility.embedColourError)
                        .setAuthor({ name: "Error" })
                        .setDescription(MessageUtility.createErrorMessage(MessageUtility.ErrorMessages.NOT_CACHED_GUILD))
                        .setTimestamp()
                ]
            })
            return;
        }

        await interaction.deferReply({ ephemeral: true });

        const ticketConfig = await prisma.ticketConfig.findUnique({ where: { guild_id: interaction.guild.id } });

        if (!ticketConfig) {
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(MessageUtility.embedColourError)
                        .setAuthor({ name: "Error" })
                        .setDescription(MessageUtility.createErrorMessage(MessageUtility.ErrorMessages.NO_TICKET_CONFIG))
                        .setTimestamp()
                ]
            })
            return;
        }

        const memberTicket = await prisma.tickets.findFirst({ where: { guild_id: interaction.guild.id, creator_id: interaction.member.id, closed: false } })
        const memberHasOpenTicket = memberTicket === null ? false : true;

        if (memberHasOpenTicket) {
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(MessageUtility.embedColourError)
                        .setAuthor({ name: "Error" })
                        .setDescription(MessageUtility.createErrorMessage(`You have exceeded the number of open tickets you can have at once. Please first close your ticket at ${channelMention(memberTicket!.ticket_channel_id)}`))
                        .setTimestamp()
                ]
            })
            return;
        }

        switch (ticketConfig.ticket_create_type) {
            case 'Button': {
                const ticketId = Helper.generateTicketId();
                const ticketChannel = await Helper.CreateTicketChannel(interaction, ticketConfig, ticketId)
                await ticketChannel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(MessageUtility.embedColourDefault)
                            .setAuthor({ name: interaction.user.username, iconURL: interaction.member.displayAvatarURL() })
                            .setTitle(`Ticket - ${ticketId}`)
                            .setDescription(`
                            Thank you for contacting support. We will be with you momentarily, please wait up to \`48 hours\`

                            ${MessageUtility.createTipMessage('While you wait, why don\'t you tell us about your query')}
                            `)
                            .setTimestamp()
                    ],
                    components: [
                        new ActionRowBuilder<ButtonBuilder>().setComponents(
                            new ButtonBuilder()
                                .setCustomId('ticket-lock-button')
                                .setLabel('Lock Ticket')
                                .setEmoji('🔐')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId('ticket-close-button')
                                .setLabel('Close Ticket')
                                .setEmoji('📁')
                                .setStyle(ButtonStyle.Danger)
                        )
                    ]
                })
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(MessageUtility.embedColourSuccess)
                            .setAuthor({ name: "Success" })
                            .setDescription(`
                            ${MessageUtility.createSuccessMessage("Successfully created your ticket!")}

                            ${MessageUtility.createInfoMessage(`You can find you ticket at ${channelMention(ticketChannel.id)}`)}
                            `)
                            .setTimestamp()
                    ]
                })
                return;
            }
            case 'ButtonModal': {
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

                await interaction.showModal(createTicketModal);

                return;
            }
            default:
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(MessageUtility.embedColourError)
                            .setAuthor({ name: "Error" })
                            .setDescription(MessageUtility.createErrorMessage(MessageUtility.ErrorMessages.UNKNOWN_ERROR))
                            .setTimestamp()
                    ]
                })
                return;
        }
    }
}

export default new TicketCreateBtn();