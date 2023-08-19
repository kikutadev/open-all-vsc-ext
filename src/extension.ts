import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

function main(folderPath: string, recursive: boolean, newGroup: boolean) {
  const filesToOpen = getFilesToOpen(folderPath, recursive);
  confirmToOpen(filesToOpen, folderPath, newGroup);
}

// 開くべきファイルを取得
function getFilesToOpen(folderPath: string, recursive: boolean): string[] {
  const files = getFiles(folderPath, recursive); // 対象フォルダからファイルを取得
  const openFiles = getOpenedFiles(); // 開いているファイルを取得
  return files.filter((file) => !openFiles.includes(file)); // 開いていないファイルをフィルター
}

// 既に開いているファイルのリストを取得
function getOpenedFiles(): string[] {
  return vscode.workspace.textDocuments.map((document) => document.fileName);
}

// ファイルリストを取得（再帰的な探索が可能）
function getFiles(folderPath: string, recursive: boolean): string[] {
  return recursive
    ? getAllFiles(folderPath) // 再帰的にフォルダ内のファイルを取得
    : fs.readdirSync(folderPath); // 単一フォルダ内のファイルを取得
}

// フォルダ内のすべてのファイルリストを再帰的に取得
function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles); // フォルダの場合、再帰的に探索
    } else {
      arrayOfFiles.push(filePath); // ファイルの場合、配列に追加
    }
  });

  return arrayOfFiles;
}

// 確認ダイアログを表示し、ファイルを開く
function confirmToOpen(files: string[], folderPath: string, newGroup: boolean) {
  if (files.length === 0) {
    showStatusBarMessage("すべてのファイルが開かれています。", 3000);
    return;
  }
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
    openDocuments(files, folderPath, newGroup); // ファイル数が10以下の場合、直接開く
  }
}

// 複数のファイルを開く
function openDocuments(files: string[], folderPath: string, newGroup: boolean) {
  const viewColumn = newGroup
    ? (vscode.window.activeTextEditor?.viewColumn || 1) + 1
    : undefined;
  files.forEach((file) => openDocument(file, folderPath, viewColumn));
}

// 単一のファイルを開く
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

// ステータスバーにメッセージを表示
function showStatusBarMessage(message: string, duration?: number) {
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left
  );
  statusBarItem.text = message;
  statusBarItem.show();

  // 指定された時間後にメッセージを隠す
  if (duration) {
    setTimeout(() => statusBarItem.dispose(), duration);
  }

  return statusBarItem;
}
export function activate(context: vscode.ExtensionContext) {
  // コマンド1: フォルダ内のすべてのテキストファイルを開く
  let openFilesInFolderDisposable = vscode.commands.registerCommand(
    "extension.openFilesInFolder",
    (folder) => {
      if (folder?.fsPath) {
        main(folder.fsPath, false, false);
      }
    }
  );

  // コマンド2: フォルダ内のすべてのファイルを再帰的に開く
  let openFilesRecursivelyDisposable = vscode.commands.registerCommand(
    "extension.openFilesInFolderRecursively",
    (folder) => {
      if (folder?.fsPath) {
        main(folder.fsPath, true, false);
      }
    }
  );

  // コマンド3: フォルダ内のすべてのファイルを新しいエディターグループで開く
  let openFilesInNewGroupDisposable = vscode.commands.registerCommand(
    "extension.openFilesInNewGroup",
    (folder) => {
      if (folder?.fsPath) {
        main(folder.fsPath, false, true);
      }
    }
  );
  // コマンド4: フォルダ内のすべてのファイルを新しいエディターグループで開く
  let openFilesInNewGroupRecursivelyDisposable =
    vscode.commands.registerCommand(
      "extension.openFilesInNewGroupRecursively",
      (folder) => {
        if (folder?.fsPath) {
          main(folder.fsPath, true, true);
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
