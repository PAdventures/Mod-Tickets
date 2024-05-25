# Mod Tickets

![CodeQL analysis](https://github.com/github/docs/actions/workflows/codeql.yml/badge.svg)

Mod Tickets is a discord bot (or App) generated using the TypeScript reciple template

> This application was generated using the [`create-reciple`](https://npm.im/create-reciple) template. Please show them some love as this project wouldn't have been easy without them

## Features

Mod Tickets has a range of simple features to make your ticketing experience as smooth as possible

Some example are:

- Creating tickets (obviously)
- Ticket channel locking
- Transcripts

### Commands

Mod Tickets uses slash commands and context menu commands for configuration as well as for you to use the various systems

#### Ping - Slash Command

Usage: `/ping`

Description: View the Websocket Heartbeat and Roundtrip latency

Cooldown: `2 minutes`

#### Help - Slash Command

Usage: `/help`

Description: Shows all commands available with their respective description

Cooldown: `1 minute`

#### Configure - Slash Command

Usage:\
`/configure enable-system`\
`/configure disable-system`\
`/configure system <Req. Options> [Opt. Options]`

Description: Manage the configuration data that Mod Tickets will use

Cooldown: `2 minutes`
