import { SlashCommandBuilder } from "reciple";
import { BaseModule } from "../BaseModule.js";
import { EmbedBuilder } from "discord.js";
import MessageUtility from "../Utils/MessageUtility.js";

export class PingCmd extends BaseModule {
    public versions: string | string[] = "^8";

    public onStart(): string | boolean | Error | Promise<string | boolean | Error> {
        this.commands = [
            new SlashCommandBuilder()
                .setName('ping')
                .setDescription('View the Websocket Heartbeat and Roundtrip latency')
                .setCooldown(2 * 60 * 1000)
                .setDMPermission(true)
                .setExecute(async ({ interaction, client }) => {
                    const initialResponse = await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(MessageUtility.embedColourDefault)
                                .setAuthor({ name: "Pinging..." })
                                .setDescription("Please wait momentarily while I crunch some data")
                                .setTimestamp()
                        ],
                        ephemeral: true,
                        fetchReply: true,
                    });

                    const websocketHeartbeat = client.ws.ping;
                    const roundtripLatency = initialResponse.createdTimestamp - interaction.createdTimestamp;

                    await interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(MessageUtility.embedColourDefault)
                                .setAuthor({ name: "Pong!", iconURL: client.user.displayAvatarURL() })
                                .setDescription(`
                                **Websocket Heartbeat:** \`${websocketHeartbeat === -1 ? "Invalid" : `${websocketHeartbeat}ms`}\`
                                **Roundtrip Latency:** \`${roundtripLatency}\`ms
                                `)
                                .setTimestamp()
                        ]
                    })
                })
        ]
        return true;
    }
}

export default new PingCmd();