import { Player } from '@minecraft/server';
import * as bricklib from './bricklib/index.js';

type EvTypes = {
  hello: [Player, ...string[]],
};

const mgr = new bricklib.CommandManager();
const ev = new bricklib.EventManager<EvTypes>();
bricklib.enableCustomChatCmds(mgr, '!');

mgr.registerCommand([ 'hello', 'hi' ], (src, args) => {
  ev.emit('hello', src, ...args);
  return 0;
});

ev.on('hello', (plr, ...args) => {
  plr.sendMessage('through ev mgr: ' + JSON.stringify(args));
});

mgr.registerCommand([ 'icon' ], (src) => {
  src.sendMessage(JSON.stringify(bricklib.glyphs.glyphs));
  return 1;
});


mgr.registerCommand([ 'even' ], (src) => {
  const db = new bricklib.Database(src);
  db.load('even');
  let val = db.get('val') ?? 0;

  if (val % 2 == 0) src.sendMessage('Every even: is even: ' + val);
  else              src.sendMessage('Every even: not even: ' + val);

  db.set('val', val + 1);
  db.save('even');
  return 0;
});
