const whitelist = require('../whitelisteditems');
const allowedGroups = [ 1286637407 ];
const {Client, Intents} = require("discord.js");
const discordintents = [Intents.FLAGS.GUILD, Intents.FLAGS.GUILD_MESSAGES]

import * as att from 'js-tale/dist';
import discord from 'discord.js';
import { config } from './config';


var discordBot:discord.Client;
var attBot:att.Client;

var connection:undefined|att.ServerConnection;

init();

async function init()
{ 
    try
    {
        discordBot  = new Client({ intents: discordintents});
        discordBot.login(config.token);
        
        discordBot.once("ready", () =>{
            console.log(`${discordBot.user?.username} is online`)
            discordBot.user?.setActivity("testing phase, DO NOT USE", { type: "PLAYING" })
        })

        discordBot.on('messageCreate', handleDiscordMessage);
        
        await new Promise<void>(resolve => discordBot.once('ready', () => resolve()));

        
        attBot = new att.Client(config);
        await attBot.initialize();
        
        const inviteList = attBot.groupManager.invites;
        inviteList.on('create', (invite: { info: { id: number; }; accept: () => void; reject: () => void; }) =>
        {
            if (allowedGroups.includes(invite.info.id))
            {
                invite.accept();
            }
            else
            {
                invite.reject();
            }
        });

        await inviteList.refresh(true);

        var group = await attBot.groupManager.groups.get(config.groupId);

        group.automaticConsole(serverConnected);
    }
    catch( e ){
        console.log( e )
    }
    
};


function handleDiscordMessage(message:discord.Message, args?:any)
{
    var content = message.content;
    var prefix = "cm "
    
    if (content.length > 0 && content.startsWith(prefix))
    {
        var tmessage = content.substring(prefix.length).trim();
        args = tmessage.split(" ")

        if ( args && args.length >= 1 )
            {
                var command = args.shift();
                var commandFunction = discordHandler[command];
                if (!!commandFunction)
                {
                    commandFunction(message, args);
                }
            }
    }
}

function checkWhitelist(itemName:string) {
    console.log("checking whitelist")
    var i = 0
    var whitelisted = false
    //console.log(whitelistedItems.items + " " + whitelistedItems.items.length)
    for (i = 0; i < whitelist.items.length; i++) {
      if (itemName.toLowerCase() == whitelist.items[i]) {
        whitelisted = true
      }
    }
    console.log("whitelisted = " + whitelisted)
    return whitelisted;
  }

var discordHandler : {[command:string]:(message:discord.Message, args?:any)=>void} = 
{
    'ping' : message => message.reply('pong'),

    'help' : message => message.reply("go check out what I can do over at " + '#bot-help'),
    'whitelist': message => message.reply("you can see what a can and cannot spawn for you at " + '#bot-whitelist'),

    'spawn' : async (message, args) =>
    {
        //gathers the words for separate identification
        let playername = args[1]
        let asset = args[2]
        let count = args[3]
        
        //array of channel id's the bot is allowed to run the commands from
        var allowedchannels = ["651525381873991697", "648813527179460610", "796153346573991937", "648813309784752148"]
        //catchblocks for when people dont include required information
        {
            asset = '"'+ asset +'"';
        }
        if ( !count )
        {
            count = 1;
        }
        //checks if there is an connection
        if (!connection)
        {
            message.reply("Server is not online");
            return;
        }
        else
        {
            if (allowedchannels.includes(message.channel.id)) 
            {
                if (count <= 50)
                {
                    if(checkWhitelist(asset) == false)
                    {
                        message.reply("item is not found or not allowed")
                        return;
                    }
                    try
                    {
                        connection.send(`spawn ${playername} ${asset} ${count}`)
                        message.reply("```" + `spawned ${count} number of ${asset} for ${playername}` + "```")
                    } catch ( e ) 
                    {
                        console.log ( e )
                        message.reply('```'+ "Cannot send command, is server offline?" +'```')
                        return;
                    }
                    
                }
                else{
                    message.reply(`I can not spawn more then 50 items for you, ${count} is simply too mutch`)
                }
            }
            else
            {
                message.reply("you are not allowed to use that command here")
            }
        }

    },
    'level' : async (message, args) =>
    {
        //gathers the words for separate identification
        let playername = args[1]
        let field = args[2]
        let count = args[3]
        //array of channel id's the bot is allowed to run the commands from
        var allowedchannels = ["651525381873991697", "648813527179460610", "796153346573991937", "648813309784752148"]
        //catchblocks for when people dont incluse nessisairy or wrong information
        if ((!count || count == String||count > 3)){
            count = 1
            message.reply('```' + "invalid number of levels, i'll level you up only once" + '```')
            }
        if(field != ["forging", "mining", "woodcutting", "melee", "ranged"]){
            message.reply('```' + "this is not a valid skill, please try a diffrent one from" + '#bot-help' + '```')
            }
        //command handler
        if (allowedchannels.includes(message.channel.id))
        {
            try{
                for (let i = 0; i < count; i++)
                {
                    connection?.send(`player progression pathlevelup ${playername} ${field}`)
                }
                message.reply(`attempted to level up ${playername} ${count} amount of times`)
            }
            catch( e ){
                console.log ( e )
                message.reply('```'+ "Cannot send command, is server offline?" +'```')
                return;
            }
                
        }
    }
};


function serverConnected(newConnection:att.ServerConnection)
{
    console.log(`Connected to ${newConnection.server.info.name}`);

    connection = newConnection;

    newConnection.on('closed', () => 
    { 
        console.log(`Connection to ${newConnection.server.info.name} closed`);

        if (connection == newConnection)
        {
            connection = undefined;
        }
    });
}

