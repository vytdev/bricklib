import {
  CommandPermissionLevel,
  CustomCommandParamType,
  CustomCommandStatus,
  Player,
  system,
  world
} from "@minecraft/server";


world.beforeEvents.chatSend.subscribe(ev => {
  if (!ev.message.startsWith("!"))
    return;
  ev.cancel = true;
  ev.sender.sendMessage({ rawtext: [{ text: "Hello, world!" }]});
});


system.beforeEvents.startup.subscribe(ev => {
  ev.customCommandRegistry.registerCommand({
    name: "bricklib",
    description: "Test custom command",
    permissionLevel: CommandPermissionLevel.Any,
    mandatoryParameters: [
      {
        name: "req1",
        type: CustomCommandParamType.PlayerSelector
      }
    ],
    optionalParameters: [
      {
        name: "opt2",
        type: CustomCommandParamType.String,
      }
    ]
  }, (_, req1: Player[], opt2: string) => {
      req1.forEach(e => e.sendMessage(opt2));
      return { status: CustomCommandStatus.Success };
  })
});
