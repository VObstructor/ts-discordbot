const whitelist = require('../whitelisteditems');

import * as att from 'js-tale/dist';
import discord from 'discord.js';
import { config } from './config';


var discordBot:discord.Client;
var attBot:att.Client;

var connection:undefined|att.ServerConnection;

init();

async function init()
{ 
    discordBot  = new discord.Client();
    discordBot.login(config.token);

    discordBot.on('message', handleDiscordMessage);
    
    await new Promise<void>(resolve => discordBot.once('ready', () => resolve()));

    attBot = new att.Client();
    await attBot.init(config);
    
    var group = await attBot.groupManager.groups.get(config.groupId);

    group.automaticConsole(serverConnected);
};

function handleDiscordMessage(message:discord.Message)
{
    var content = message.content;
    
    if (content.startsWith('cm'))
    {
        var space = content.indexOf(' ', 2);

        if (space > 0)
        {
            var command = content.substr(1, space - 1).trim();
        }
        else
        {
            var command = content.substr(1);
        }

        var handler = discordHandler[command];

        if (!!handler)
        {
            handler(message, content.substr(space + 1));   
        }
        else
        {
            message.reply("Unknown command: " + command);
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

    'help' : message => message.reply("go check out what I can do over at" + '#bot-help'),
    'whitelist': message => message.reply("you can see what a can and cannot spawn for you at" + '#bot-whitelist'),

    'players' : async (message) =>
    {
        //checks if there is an connection
        if (!connection)
        {
            message.reply("Server is not online");
            return;
        }
        if (discord.Channel.name == "other-commands" || discord.Channel.name == "bot-testing")
        try{
            var response = await connection.send(`player list`);

            message.reply(response.Result.map((item:any) => item.username).join('\n')); 
        }
        catch( e ){
            console.log ( e )
            message.reply('```'+ "Cannot send command, is server offline?" +'```')
            return;
        }
        
    },

    'spawn' : async (message, args) =>
    {
        //gathers the words for separate identification
        let playername = args[1]
        let asset = args[2]
        let count = args[3]
        
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
            if (discord.Channel.name == "trusted-spawn-commands" || discord.Channel.name == "bot-testing" || discord.Channel.name == "spawn-commands") 
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
                        message.reply("```" + `spawned ${count} of ${asset} for ${playername}` + "```")
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
        let playername = args[1]
        let field = args[2]
        let count = args[3]
        //catchblocks for when people dont incluse nessisairy or wrong information
        if ((!count || count == String||count > 3)){
            count = 1
            message.reply('```' + "invalid number of levels, i'll level you up only once" + '```')
            }
        if(field != ["forging", "mining", "woodcutting", "melee", "ranged"]){
            message.reply('```' + "this is not a valid skill, please try a diffrent one from" + '#bot-help' + '```')
            }
        //command handler
        if (discord.Channel.name == "trusted-spawn-commands" || discord.Channel.name == "bot-testing" || discord.Channel.name == "spawn-commands" || discord.Channel.name == "other-command")
        {

            
            try{
                for (let i = 0; i < count; i++)
                {
                    connection?.send(`player progression pathlevelup ${playername} ${field} `)
                    message.reply(`attempted to level up ${playername} ${count} amount of times`)
                }
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

function playerJoined(player:any)
{
    console.log(`${player.name} joined the server.`);
}