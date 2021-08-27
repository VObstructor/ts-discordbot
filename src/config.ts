type botconfig = {
    clientId: string;
    clientSecret:  string;
    scope: string;
    token: string
    groupId: number;

};


export const config: botconfig = {
    clientId: process.env.clientId || '',
    clientSecret:  process.env.clientSecret || '',
    scope: "ws.group ws.group_members ws.group_servers ws.group_bans ws.group_invites group.info group.join group.leave group.view group.members group.invite server.view server.console",
    token: process.env.token || '' ,
    groupId: 1286637407,

};
