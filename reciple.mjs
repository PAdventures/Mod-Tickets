// @ts-check
import { CooldownPrecondition, CommandPermissionsPrecondition } from 'reciple';
import { IntentsBitField } from 'discord.js';

/**
 * @satisfies {import('reciple').RecipleConfig}
 */
export const config = {
    token: process.env.TOKEN ?? '',
    commands: {
        contextMenuCommand: {
            enabled: true,
            enableCooldown: true,
            acceptRepliedInteractions: false,
            registerCommands: {
                registerGlobally: true,
                registerToGuilds: []
            }
        },
        messageCommand: {
            enabled: false,
        },
        slashCommand: {
            enabled: true,
            enableCooldown: true,
            acceptRepliedInteractions: false,
            registerCommands: {
                registerGlobally: true,
                registerToGuilds: []
            }
        }
    },
    applicationCommandRegister: {
        enabled: true,
        allowRegisterGlobally: true,
        allowRegisterToGuilds: true,
        registerEmptyCommands: true,
        registerToGuilds: []
    },
    client: {
        intents: [
            IntentsBitField.Flags.Guilds,
            IntentsBitField.Flags.GuildMembers,
            IntentsBitField.Flags.GuildMessages,
            IntentsBitField.Flags.MessageContent,
        ]
    },
    logger: {
        enabled: true,
        debugmode: null,
        coloredMessages: true,
        disableLogPrefix: false,
        logToFile: {
            enabled: true,
            logsFolder: './logs/production',
            file: 'latest.log'
        }
    },
    modules: {
        dirs: ['./modules/**/*'],
        exclude: ['BaseModule', 'Prisma'],
        filter: file => true,
        disableModuleVersionCheck: false
    },
    preconditions: [
        CooldownPrecondition.create(),
        CommandPermissionsPrecondition.create()
    ],
    cooldownSweeperOptions: {
        timer: 1000 * 60 * 60
    },
    checkForUpdates: true,
    version: `^8.3.2`
};
