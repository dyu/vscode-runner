'use strict';

import vscode = require('vscode');
import cp = require('child_process');
import path = require('path');

const win32 = process.platform === 'win32';

const defaultExtensionMap = {
  coffee: "coffee"
}

const defaultLanguageMap = {
  go: "go run",
  perl: "perl",
  perl6: "perl6",
  ruby: "ruby",
  python: "python",
  php: "php",
  shell: "bash",
  typescript: "tsc",
  javascript: "node",
  powershell: "powershell -noninteractive -noprofile -c -"
};

function getActionFor(fileName: string) {
  if (!fileName) return;
  var extensionMap = {};
  var userExtensionMap = vscode.workspace.getConfiguration('runner')['extensionMap'] || {};
  for (var key in defaultExtensionMap) { extensionMap[key] = defaultExtensionMap[key]; }
  for (var key in userExtensionMap) { extensionMap[key] = userExtensionMap[key]; }
  var ids = Object.keys(extensionMap).sort();
  for (var id in ids) {
    var ext = ids[id];
    if (fileName.match(ext.match(/^\b/) ? '' : '\\b' + ext + '$')) {
      return extensionMap[ext];
    }
  }
  return null;
}

export function activate(ctx: vscode.ExtensionContext): void {
  var languageMap = {};
  var userLanguageMap = vscode.workspace.getConfiguration('runner')['languageMap'] || {};
  for (var key in defaultLanguageMap) { languageMap[key] = defaultLanguageMap[key]; }
  for (var key in userLanguageMap) { languageMap[key] = userLanguageMap[key]; }
  ctx.subscriptions.push(vscode.commands.registerCommand('extension.runner', () => {
    var fileName = vscode.window.activeTextEditor.document.fileName;
    var languageId = vscode.window.activeTextEditor.document.languageId;
    var action = languageMap[languageId];
	if (!action) action = getActionFor(fileName);
    if (!action) return;
    fileName = path.relative(".", fileName);
    var output = vscode.window.createOutputChannel('Runner: ' + action + ' ' + fileName);
    output.show();
    var sh = win32 ? 'cmd' : 'sh';
    var shflag = win32 ? '/c' : '-c';
    cp.execFile(sh, [shflag, action + ' ' + fileName], {}, (err, stdout, stderr) => {
      output.append(stdout.toString());
      output.append(stderr.toString());
    });
  }));
}
