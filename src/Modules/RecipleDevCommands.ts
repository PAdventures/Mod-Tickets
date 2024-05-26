import { DevCommandManager } from 'reciple-dev-commands';

export default new DevCommandManager({
    devGuilds: [process.env.DEVELOPER_GUILD!],
    devUsers: [process.env.DEVELOPER_USER!]
});