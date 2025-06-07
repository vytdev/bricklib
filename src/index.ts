import { FormCancelationReason } from '@minecraft/server-ui';
import * as bricklib from './bricklib/index.js';
import * as gatepass from './gatepass/index.js';
import * as sift from './sift/index.js';

/* load plugins */
const load = bricklib.plugin.loadPlugin;
load('gatepass');
load('sift');


const mgr = new bricklib.command.CommandManager();
bricklib.command.enableCustomChatCmds(mgr, '\\');



mgr.registerCommand([ 'hello', 'hi' ], (src, args) => {
  gatepass.assertPermission('basic.hello', src);
  src.sendMessage(src.name + '\n' + args.join('\n') + '\nEND OF ARGS');
  return 0;
});

const def = {
  id: 'echo',
  name: 'echo',
  args: [
    {
      id: 'text',
      type: sift.parsers.variadic(sift.parsers.string()),
    }
  ]
};

mgr.registerCommand(...sift.makeCommand(def, (args, src) => {
  gatepass.assertPermission('chat.echo', src);
  src.sendMessage(args.text.join(' '));
  return 0;
}));




const { registerForm, showForm } = bricklib.forms;
const nextTick = bricklib.ticks.setTickTimeout;

nextTick(() => {


mgr.registerCommand([ 'form' ], (src) => {
  gatepass.assertPermission('dev.bricklib.form-cmd', src);
  src.sendMessage('please close chats');
  nextTick(() => showForm('action-frm', src));
  return 0;
})



registerForm('action-frm', {
  title: 'Action Form Title',
  body: 'Body Text',
  cancel: (ctx, r) => {
    if (r == FormCancelationReason.UserBusy)
      return nextTick(() => ctx.goto('action-frm'));
    ctx.user.sendMessage('canceled action-frm bc: ' + r)
  },
  buttons: [
    {
      text: 'btn1 -> msg-frm',
      action: (ctx) => ctx.goto('msg-frm'),
      /* no icon */
    },
    {
      text: 'btn2 -> modal-frm',
      action: (ctx) => ctx.goto('modal-frm'),
      icon: 'textures/items/diamond',
    },
    {
      text: 'btn3 -> itself',
      action: (ctx) => ctx.goto('action-frm'),
    }
  ],
});

registerForm('msg-frm', {
  title: 'Message Form Title',
  message: 'The message',
  cancel: (ctx, r) => {
    if (r == FormCancelationReason.UserBusy)
      return nextTick(() => ctx.goto('msg-frm'));
    ctx.user.sendMessage('canceled msg-frm bc: ' + r)
  },
  btn1: {
    text: 'btn1 -> action-frm',
    action: (ctx) => ctx.goto('action-frm'),
  },
  btn2: {
    text: 'btn2 -> modal-frm',
    action: (ctx) => ctx.goto('modal-frm'),
  }
});

registerForm('modal-frm', {
  title: 'Modal Form Title',
  cancel: (ctx, r) => {
    if (r == FormCancelationReason.UserBusy)
      return nextTick(() => ctx.goto('modal-frm'));
    ctx.user.sendMessage('canceled modal-frm bc: ' + r)
  },
  inputs: [
    {
      id: 'text-field',
      type: 'text',
      label: 'Text Label',
      default: 'Default Value',
      placeholder: 'Placeholder for text',
    },
    {
      id: 'toggle-field',
      type: 'toggle',
      label: 'Label For Toggle',
      default: true,
    },
    {
      id: 'slider-field',
      type: 'slider',
      label: 'Label For Slider',
      default: 50,
      min: 10,
      max: 90,
      step: 2,
    },
    {
      id: 'dropdown-field',
      type: 'dropdown',
      label: 'Label For Dropdown',
      default: 1,
      options: ['prev', 'the default', 'another value', 'extra vals'],
    }
  ],
  submit: (ctx, result) => ctx.user.sendMessage(JSON.stringify(result)),
});


});
