import * as bricklib from "./bricklib/index.js";


const mgr = new bricklib.command.CommandManager();
bricklib.command.enableCustomChatCmds(mgr, '!');

mgr.registerCommand([ 'hello', 'hi' ], (src, args) => {
  src.sendMessage(JSON.stringify(args));
  return 0;
});
