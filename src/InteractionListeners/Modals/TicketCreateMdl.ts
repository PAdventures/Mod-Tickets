import { InteractionListenerType } from "reciple-interaction-events";
import { BaseModule } from "../../BaseModule.js";
import { CacheType, channelMention, EmbedBuilder, ModalSubmitInteraction, PermissionFlagsBits } from "discord.js";
import MessageUtility from "../../Utils/MessageUtility.js";
import { prisma } from "../../Prisma.js";
import Helper from "../../Utils/Helper.js";

export class TicketCreateMdl extends BaseModule {
    public versions: string | string[] = "^8";

    public onStart(): string | boolean | Error | Promise<string | boolean | Error> {
        this.interactionListeners = [
            {
                type: InteractionListenerType.ModalSubmit,
                customId: "ticket-create-modal",
                requiredBotPermissions: PermissionFlagsBits.ManageChannels,
                execute: async (interaction) => {
                    return await this.HandleExecute(interaction as never as ModalSubmitInteraction<CacheType>)
                }
            }
        ]
        return true;
    }

    public async HandleExecute(interaction: ModalSubmitInteraction<CacheType>): Promise<void> {
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

        if (!ticketConfig.ticket_create_type.includes("Modal")) {
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

        const ticketTopic = interaction.fields.getTextInputValue('ticketTopic');
        const ticketDescription = interaction.fields.getTextInputValue('ticketDescription');
        const ticketExtraNotes = interaction.fields.getTextInputValue('ticketExtraNotes');

        const ticketId = Helper.generateTicketId();
        const ticketChannel = await Helper.CreateTicketChannel(interaction, ticketConfig, ticketId);
        await ticketChannel.send({
            embeds: [
                new EmbedBuilder()
                    .setColor(MessageUtility.embedColourDefault)
                    .setAuthor({ name: interaction.user.username, iconURL: interaction.member.displayAvatarURL() })
                    .setTitle(`Ticket - ${ticketId}`)
                    .setDescription(`
                    Thank you for contacting support. We will be with you momentarily, please wait up to \`48 hours\`

                    ${MessageUtility.createTipMessage('While you wait, why don\'t you tell us a bit more about your query')}
                    `)
                    .addFields([
                        { name: "Topic", value: `${ticketTopic}` },
                        {
                            name: "Description",
                            value: `${ticketDescription}`,
                            inline: true
                        },
                        {
                            name: "Extra Notes",
                            value: `${ticketExtraNotes}`,
                            inline: true,
                        }
                    ])
                    .setTimestamp()
            ]
        })
    }
}

export default new TicketCreateMdl();