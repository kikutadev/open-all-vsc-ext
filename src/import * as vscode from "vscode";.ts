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
  let viewColumn: vscode.ViewColumn | undefined = undefined;

  if (newGroup) {
    viewColumn = vscode.ViewColumn.Beside;
  }

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

// activate関数とdeactivate関数はそのまま
