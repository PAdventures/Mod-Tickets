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
                ],
                ephemeral: true
            })
            return;
        }

        const ticketConfig = await prisma.ticketConfig.findUnique({ where: { guild_id: interaction.guild.id } });

        if (!ticketConfig) {
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(MessageUtility.embedColourError)
                        .setAuthor({ name: "Error" })
                        .setDescription(MessageUtility.createErrorMessage(MessageUtility.ErrorMessages.NO_TICKET_CONFIG))
                        .setTimestamp()
                ],
                ephemeral: true
            })
            return;
        }

        const memberTicket = await prisma.tickets.findFirst({ where: { guild_id: interaction.guild.id, creator_id: interaction.member.id, closed: false } })
        const memberHasOpenTicket = memberTicket === null ? false : true;

        if (memberHasOpenTicket) {
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(MessageUtility.embedColourError)
                        .setAuthor({ name: "Error" })
                        .setDescription(MessageUtility.createErrorMessage(`You have exceeded the number of open tickets you can have at once. Please first close your ticket at ${channelMention(memberTicket!.ticket_channel_id)}`))
                        .setTimestamp()
                ],
                ephemeral: true
            })
            return;
        }

        switch (ticketConfig.ticket_create_type) {
            case 'Button': {
                const ticketId = Helper.generateTicketId();
                const ticketChannel = await Helper.CreateTicketChannel(interaction, ticketConfig, ticketId)
                try {
                    await prisma.tickets.create({
                        data: {
                            guild_id: interaction.guild.id,
                            ticket_channel_id: ticketChannel.id,
                            ticket_id: ticketId,
                            creator_id: interaction.member.id
                        }
                    });
                } catch (err) {
                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(MessageUtility.embedColourError)
                                .setAuthor({ name: "Error" })
                                .setDescription(MessageUtility.createErrorMessage(MessageUtility.ErrorMessages.DATABASE_ERROR))
                                .setTimestamp()
                        ],
                        ephemeral: true
                    })
                    await ticketChannel.delete();
                    return;
                }
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
                        Helper.TicketPanelButtons()
                    ]
                })
                await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(MessageUtility.embedColourSuccess)
                            .setAuthor({ name: "Success" })
                            .setDescription(`
                            ${MessageUtility.createSuccessMessage("Successfully created your ticket!")}

                            ${MessageUtility.createInfoMessage(`You can find you ticket at ${channelMention(ticketChannel.id)}`)}
                            `)
                            .setTimestamp()
                    ],
                    ephemeral: true
                })
                return;
            }
            case 'ButtonModal': {
                await Helper.ShowCreateTicketModal(interaction);
                return;
            }
            default:
                await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(MessageUtility.embedColourError)
                            .setAuthor({ name: "Error" })
                            .setDescription(MessageUtility.createErrorMessage(MessageUtility.ErrorMessages.UNKNOWN_ERROR))
                            .setTimestamp()
                    ],
                    ephemeral: true,
                })
                return;
        }
    }
}

export default new TicketCreateBtn();