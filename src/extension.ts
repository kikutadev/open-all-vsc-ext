import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

function openFiles(folderPath: string, recursive: boolean, newGroup: boolean) {
  const files = recursive
    ? getAllFiles(folderPath)
    : fs.readdirSync(folderPath);
  confirmAndOpenDocuments(files, folderPath, newGroup);
}

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

function confirmAndOpenDocuments(
  files: string[],
  folderPath: string,
  newGroup: boolean
) {
  if (files.length > 10) {
    vscode.window
      .showWarningMessage(
        `${files.length}のファイルを開こうとしています。続行しますか？`,
        { modal: true },
        "Yes",
        "No"
      )
      .then((selection) => {
        if (selection === "Yes") {
          openDocuments(files, folderPath, newGroup);
        }
      });
  } else {
    openDocuments(files, folderPath, newGroup);
  }
}

function openDocuments(files: string[], folderPath: string, newGroup: boolean) {
  // 現在のエディターグループの列数を取得
  const viewColumn = newGroup
    ? (vscode.window.activeTextEditor?.viewColumn || 1) + 1
    : undefined;

  files.forEach((file) => openDocument(file, folderPath, viewColumn));
}

function openDocument(
  file: string,
  folderPath: string,
  viewColumn?: vscode.ViewColumn
) {
  const filePath = path.isAbsolute(file) ? file : path.join(folderPath, file);
  const fileUri = vscode.Uri.file(filePath);

  vscode.workspace.openTextDocument(fileUri).then((doc) => {
    vscode.window.showTextDocument(doc, { viewColumn });
  });
}

export function activate(context: vscode.ExtensionContext) {
  // コマンド1: フォルダ内のすべてのテキストファイルを開く
  let openFilesInFolderDisposable = vscode.commands.registerCommand(
    "extension.openFilesInFolder",
    (folder) => {
      if (folder?.fsPath) {
        openFiles(folder.fsPath, false, false);
      }
    }
  );

  // コマンド2: フォルダ内のすべてのファイルを再帰的に開く
  let openFilesRecursivelyDisposable = vscode.commands.registerCommand(
    "extension.openFilesInFolderRecursively",
    (folder) => {
      if (folder?.fsPath) {
        openFiles(folder.fsPath, true, false);
      }
    }
  );

  // コマンド3: フォルダ内のすべてのファイルを新しいエディターグループで開く
  let openFilesInNewGroupDisposable = vscode.commands.registerCommand(
    "extension.openFilesInNewGroup",
    (folder) => {
      if (folder?.fsPath) {
        openFiles(folder.fsPath, false, true);
      }
    }
  );
  // コマンド4: フォルダ内のすべてのファイルを新しいエディターグループで開く
  let openFilesInNewGroupRecursivelyDisposable =
    vscode.commands.registerCommand(
      "extension.openFilesInNewGroupRecursively",
      (folder) => {
        if (folder?.fsPath) {
          openFiles(folder.fsPath, true, true);
        }
      }
    );

  context.subscriptions.push(
    openFilesInFolderDisposable,
    openFilesRecursivelyDisposable,
    openFilesInNewGroupDisposable,
    openFilesInNewGroupRecursivelyDisposable
  );
}

export function deactivate() {}
