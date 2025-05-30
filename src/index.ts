import * as bricklib from './bricklib/index.js';
const mgr = new bricklib.command.CommandManager();
bricklib.command.enableCustomChatCmds(mgr, '!');

mgr.registerCommand([ 'hello', 'hi' ], (src, args) => {
  src.sendMessage(src.name + '\n' + args.join('\n') + '\nEND OF ARGS');
  return 0;
});



const def = {
  id: 'echo',
  name: 'echo',
  args: [
    {
      id: 'text',
      type: bricklib.args.parsers.variadic(bricklib.args.parsers.string()),
    }
  ]
};

mgr.registerCommand(...bricklib.args.makeCommand(def, (args, src) => {
  src.sendMessage(args.text.join(' '));
  return 0;
}));
