import * as bricklib from "./bricklib/index.js";


bricklib.command.registerCommand([ 'hello', 'hi' ], (src, args) => {
  src.sendMessage(JSON.stringify(args));
  return 0;
});
