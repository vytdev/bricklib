import { Player } from '@minecraft/server';
import * as bricklib from './bricklib/index.js';

type EvTypes = {
  hello: [Player, ...string[]],
};

const mgr = new bricklib.command.CommandManager();
const ev = new bricklib.events.EventManager<EvTypes>();
bricklib.command.enableCustomChatCmds(mgr, '!');

mgr.registerCommand([ 'hello', 'hi' ], (src, args) => {
  ev.emit('hello', src, ...args);
  return 0;
});

ev.on('hello', (plr, ...args) => {
  plr.sendMessage('through ev mgr: ' + JSON.stringify(args));
});
