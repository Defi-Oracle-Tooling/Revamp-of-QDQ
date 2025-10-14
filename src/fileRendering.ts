
import { renderString } from "nunjucks";
import { isBinaryFileSync } from "isbinaryfile";
import { resolve as resolvePath, join as joinPath, dirname } from "path";
import fs from "fs";
import os from "os";
import { NetworkContext } from "./networkBuilder";

export function renderTemplateDir(templateBasePath: string, context: NetworkContext): void {
    const skipDirName = context.clientType === "besu" ? "goquorum" : "besu";
    for (const filePath of _walkDir(templateBasePath, skipDirName)) {
        renderFileToDir(templateBasePath, filePath, context);
    }
}

export function copyFilesDir(filesBasePath: string, context: NetworkContext): void {
    const skipDirName = context.clientType === "besu" ? "goquorum" : "besu";
    const absBase = resolvePath(filesBasePath);
    const rootEntries = fs.readdirSync(absBase);
    for (const entry of rootEntries) {
        if (skipDirName && entry === skipDirName) continue;
        const entryAbs = resolvePath(filesBasePath, entry);
        const stats: any = fs.statSync(entryAbs);
        if (stats.isDirectory && stats.isDirectory()) {
            const subEntries = fs.readdirSync(entryAbs);
            for (const sub of subEntries) {
                const rel = joinPath(entry, sub);
                _copySingle(filesBasePath, rel, context);
            }
        } else {
            _copySingle(filesBasePath, entry, context);
        }
    }
}

function _copySingle(base: string, relPath: string, context: NetworkContext): void {
    const srcAbs = resolvePath(base, relPath);
    const stat = fs.statSync(srcAbs);
    const { mode } = stat;
    const size = stat.size;
    const outAbs = resolvePath(context.outputPath, relPath);
    const outDir = dirname(outAbs);
    if (!validateDirectoryExists(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }
    // If the source path itself is a directory, ensure directory exists and skip.
    if (stat.isDirectory()) {
        if (!validateDirectoryExists(outAbs)) {
            fs.mkdirSync(outAbs, { recursive: true });
        }
        return; // do not attempt to treat directory as file
    }
    if (isBinaryFileSync(srcAbs, size)) {
        const buffer = fs.readFileSync(srcAbs);
        fs.writeFileSync(outAbs, buffer, { mode });
        return;
    }
    const fileSrc = fs.readFileSync(srcAbs, "utf-8");
    let output = fileSrc.replace(/(\r\n|\n|\r)/gm, os.EOL);
    if (!output.endsWith(os.EOL)) output += os.EOL;
    fs.writeFileSync(outAbs, output, { mode });
}

export function renderFileToDir(basePath: string, filePath: string, context: NetworkContext): void {
    if (!validateDirectoryExists(resolvePath(basePath))) {
        throw new Error(`The template base path '${basePath}' does not exist.`);
    }

    const templatePath = resolvePath(basePath, filePath);
    const outputPath = resolvePath(context.outputPath, filePath);

    if (!_validateFileExists(templatePath)) {
        throw new Error(`The template does not exist at '${templatePath}'.`);
    }

    if (_validateFileExists(outputPath)) {
        throw new Error(`It appears that an output file already exists at '${outputPath}'. Aborting.`);
    }

    const mode = fs.statSync(templatePath).mode;
    const templateSrc = fs.readFileSync(templatePath, "utf-8");
    let output = renderString(templateSrc, context).replace(/(\r\n|\n|\r)/gm, os.EOL);
    if (!output.endsWith(os.EOL)) {
        output += os.EOL;
    }

    const outputDirname = dirname(outputPath);

    if (!validateDirectoryExists(outputDirname)) {
        fs.mkdirSync(outputDirname, { recursive: true });
    }

    fs.writeFileSync(outputPath, output, { mode });
}

export function validateDirectoryExists(path: string): boolean {
    let stat;

    try {
        stat = fs.statSync(path);
    } catch (err) {

            if ((err as any).code === "ENOENT") {
          return false;
        }
        throw err;
    }

    if (!stat.isDirectory()) {
        throw new Error(`Path ${path} exists, but is not a directory.`);
    }

    return true;
}


function _validateFileExists(path: string): boolean {
    let stat;

    try {
        stat = fs.statSync(path);
    } catch (err) {

            if ((err as any).code === "ENOENT") {
            return false;
        }
        throw err;
    }

    if (!stat.isFile()) {
        throw new Error(`Path ${path} exists, but is not a plain file.`);
    }

    return true;
}

function* _walkDir(dir: string, skipDirName?: string, basePath = ""): Iterable<string> {
    const entries = fs.readdirSync(resolvePath(dir));
    for (const entry of entries) {
        if (skipDirName && entry === skipDirName) {
            continue; // skip client-specific directory not matching selection
        }
        const fullPath = resolvePath(dir, entry);
        const stats: any = fs.statSync(fullPath);
        const relativePath = joinPath(basePath, entry);
        const isDir = typeof stats.isDirectory === 'function' && stats.isDirectory();
        if (isDir) {
            yield* _walkDir(fullPath, skipDirName, relativePath);
        } else {
            // Treat anything not a directory as a file to be yielded (supports simplified mocked stats)
            yield relativePath;
        }
    }
}
