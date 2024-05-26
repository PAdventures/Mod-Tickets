import { cli, SlashCommandBuilder } from "reciple";
import { BaseModule } from "../BaseModule.js";
import { readdir, readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { AttachmentBuilder, EmbedBuilder } from "discord.js";
import MessageUtility from "../Utils/MessageUtility.js";

export class GetLogsCmd extends BaseModule {
    public versions: string | string[] = "^8";

    public onStart(): string | boolean | Error | Promise<string | boolean | Error> {
        this.devCommands = [
            new SlashCommandBuilder()
                .setName('get-logs')
                .setDescription('Get latest bot logs')
                .addStringOption(logs => logs
                    .setName('fetch-logs')
                    .setDescription('Fetch what logs')
                    .addChoices([
                        { name: "Production", value: "production" },
                        { name: "Test", value: "test" },
                        { name: "Production & Test", value: "both" }
                    ])
                    .setRequired(false)
                )
                .setDMPermission(true)
                .setExecute(async ({ interaction }) => {
                    await interaction.deferReply({  ephemeral: true });

                    const fetchLogs = interaction.options.getString("fetch-logs", false) as "production" | "test" | "both" | null ?? "production"

                    let logFiles: { latest: string|null; compressed: string[]; type: "single" } | { production: { latest: string|null; compressed: string[] }; test: { latest: string|null; compressed: string[] }; type: "multiple" };

                    if (fetchLogs === "both") {
                        logFiles = {
                            production: await this.getLogFiles(),
                            test: await this.getLogFiles(true),
                            type: "multiple"
                        }
                    } else {
                        const fetchLogFiles = await this.getLogFiles(fetchLogs === "test" ? true : false)
                        logFiles = {
                            latest: fetchLogFiles.latest,
                            compressed: fetchLogFiles.compressed,
                            type: "single"
                        }
                    }

                    const latestProductionLog = fetchLogs === "both" || fetchLogs === "production" ? logFiles.type === "multiple" ? logFiles.production.latest : logFiles.latest : null;
                    const latestTestLog = fetchLogs === "both" || fetchLogs === "test" ? logFiles.type === "multiple" ? logFiles.test.latest : logFiles.latest : null;

                    switch (fetchLogs) {
                        case "both": {
                            if (!latestProductionLog && !latestTestLog) {
                                await interaction.editReply({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setColor(MessageUtility.embedColourError)
                                            .setAuthor({ name: "Error" })
                                            .setDescription(MessageUtility.createErrorMessage("No latest logs exist for either production or test logs"))
                                            .setTimestamp()
                                    ]
                                })
                                return;
                            }
                            await interaction.editReply(
                                latestProductionLog && latestTestLog ? {
                                    files: [
                                        new AttachmentBuilder(Buffer.from(latestProductionLog), { name: "production-latest.log" }),
                                        new AttachmentBuilder(Buffer.from(latestTestLog), { name: "test-latest.log" })
                                    ]
                                } : latestProductionLog && !latestTestLog ? {
                                    embeds: [
                                        new EmbedBuilder()
                                            .setColor(MessageUtility.embedColourWarning)
                                            .setAuthor({ name: "Warning" })
                                            .setDescription(MessageUtility.createWarningMessage('Only the production log could be provided'))
                                    ],
                                    files: [
                                        new AttachmentBuilder(Buffer.from(latestProductionLog), { name: "latest.log" })
                                    ]
                                } : {
                                    embeds: [
                                        new EmbedBuilder()
                                            .setColor(MessageUtility.embedColourWarning)
                                            .setAuthor({ name: "Warning" })
                                            .setDescription(MessageUtility.createWarningMessage('Only the test log could be provided'))
                                    ],
                                    files: [
                                        new AttachmentBuilder(Buffer.from(latestTestLog!), { name: "latest.log" })
                                    ]
                                }
                            )
                            return;
                        }
                        case 'production': {
                            await interaction.editReply(
                                latestProductionLog ? {
                                    files: [
                                        new AttachmentBuilder(Buffer.from(latestProductionLog), { name: "latest.log" })
                                    ]
                                } : {
                                    embeds: [
                                        new EmbedBuilder()
                                            .setColor(MessageUtility.embedColourError)
                                            .setAuthor({ name: "Error" })
                                            .setDescription(MessageUtility.createErrorMessage("Log file could not be produced as it doesn't exist"))
                                    ]
                                }
                            )
                            return;
                        }
                        case 'test': {
                            await interaction.editReply(
                                latestTestLog ? {
                                    files: [
                                        new AttachmentBuilder(Buffer.from(latestTestLog), { name: "latest.log" })
                                    ]
                                } : {
                                    embeds: [
                                        new EmbedBuilder()
                                            .setColor(MessageUtility.embedColourError)
                                            .setAuthor({ name: "Error" })
                                            .setDescription(MessageUtility.createErrorMessage("Log file could not be produced as it doesn't exist"))
                                    ]
                                }
                            )
                            return;
                        }
                    }
                })
        ]
        return true;
    }

    public async getLogFiles(testLogs: boolean = false): Promise<{ latest: string|null; compressed: string[]; }> {
        const dir = path.join(cli.cwd, `logs/${testLogs ? "test" : "production"}`);
        if (!existsSync(dir)) return { latest: null, compressed: [] };

        const files = (await readdir(dir)).map(f => path.join(dir, f));

        let latest: string|null = null;

        for (const file of files) {
            const base = path.basename(file);
            if (base !== 'latest.log') continue;

            const index = files.findIndex(f => f === file);
            files.splice(index, 1);

            latest = await readFile(file, { encoding: "utf-8" });
        }

        return { latest, compressed: files };
    }
}

export default new GetLogsCmd();