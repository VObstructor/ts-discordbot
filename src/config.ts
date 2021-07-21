type botconfig = {
    client_id: string;
    client_secret:  string;
    scope: string;
    token: string;
    groupId: string;
};


export const config: botconfig = {
    client_id: process.env.clientId || '',
    client_secret:  process.env.clientSecret || '',
    scope: 'ws.group ws.group_members ws.group_servers ws.group_bans ws.group_invites group.info group.join group.leave group.view group.members group.invite server.view server.console',
    token: process.env.token || '' ,
    groupId: "1286637407"
};
