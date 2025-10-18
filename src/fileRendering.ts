// Helper: Validate that a path is safe (no traversal, no illegal chars)
function isValidPath(p: string): boolean {
    // Disallow path traversal and illegal characters
    if (p.includes('..') || p.includes('~') || p.includes('//') || p.startsWith('/') || p.startsWith('\\')) return false;
    // Add more checks as needed (platform-specific)
    return /^[\w\-./]+$/.test(p);
}

// Helper: Deduplicate template files by keeping only the first occurrence of each relative path
async function deduplicateTemplateFiles(basePath: string, skipDirName?: string): Promise<string[]> {
    const seen = new Set<string>();
    const unique: string[] = [];
    for await (const filePath of _walkDirAsync(basePath, skipDirName)) {
        if (!seen.has(filePath)) {
            seen.add(filePath);
            unique.push(filePath);
        }
    }
    return unique;
}


import { renderString } from "nunjucks";
import { isBinaryFileSync } from "isbinaryfile";
import { resolve as resolvePath, join as joinPath, dirname } from "path";
import fs from "fs";
import os from "os";
import { NetworkContext } from "./networkBuilder";

const fsp = fs.promises;

// forward declaration of sync helper
function validateDirectoryExistsSync(path: string): boolean {
    try {
        const stat = fs.statSync(path);
        if (!stat.isDirectory()) throw new Error(`Path ${path} exists, but is not a directory.`);
        return true;
    } catch (err: any) {
        if (err.code === 'ENOENT') return false;
        throw err;
    }
}

// Re-export legacy name for backward compatibility (tests may import)
export const validateDirectoryExists = (p: string) => validateDirectoryExistsSync(p);
// move sync helpers earlier to satisfy TS single pass
export function* _walkDirSync(dir: string, skipDirName?: string, basePath = ""): Iterable<string> {
    const entries = fs.readdirSync(resolvePath(dir));
    for (const entry of entries) {
        if (skipDirName && entry === skipDirName) continue;
        const fullPath = resolvePath(dir, entry);
        let stats: any;
        try { stats = fs.statSync(fullPath); } catch { continue; }
        const relativePath = joinPath(basePath, entry);
        if (stats.isDirectory && stats.isDirectory()) {
            yield* _walkDirSync(fullPath, skipDirName, relativePath);
        } else {
            yield relativePath;
        }
    }
}

export function* _walkSyncFilesFirstLevel(base: string, skipDirName?: string): Iterable<string> {
    const abs = resolvePath(base);
    const entries = fs.readdirSync(abs);
    for (const entry of entries) {
        if (skipDirName && entry === skipDirName) continue;
        const full = resolvePath(abs, entry);
        const stats: any = fs.statSync(full);
        if (stats.isDirectory && stats.isDirectory()) {
            const subEntries = fs.readdirSync(full);
            for (const sub of subEntries) {
                yield joinPath(entry, sub);
            }
        } else {
            yield entry;
        }
    }
}

export function renderTemplateDir(templateBasePath: string, context: NetworkContext): void {
    const skipDirName = context.clientType === "besu" ? "goquorum" : "besu";
    for (const filePath of _walkDirSync(templateBasePath, skipDirName)) {
        renderFileToDir(templateBasePath, filePath, context);
    }
}

// Async version (deterministic ordered traversal)
export async function renderTemplateDirAsync(templateBasePath: string, context: NetworkContext): Promise<void> {
    const skipDirName = context.clientType === "besu" ? "goquorum" : "besu";
    const uniqueFiles = await deduplicateTemplateFiles(templateBasePath, skipDirName);
    for (const filePath of uniqueFiles) {
        if (!isValidPath(filePath)) {
            console.warn(`[renderTemplateDirAsync] Skipping invalid template path: ${filePath}`);
            continue;
        }
        await renderFileToDirAsync(templateBasePath, filePath, context);
    }
}

export function copyFilesDir(filesBasePath: string, context: NetworkContext): void {
    const skipDirName = context.clientType === "besu" ? "goquorum" : "besu";
    for (const relPath of _walkSyncFilesFirstLevel(filesBasePath, skipDirName)) {
        _copySingle(filesBasePath, relPath, context);
    }
}
function _copySingle(base: string, relPath: string, context: NetworkContext): void {
    const srcAbs = resolvePath(base, relPath);
    const stat = fs.statSync(srcAbs);
    const { mode, size } = stat;
    const outAbs = resolvePath(context.outputPath, relPath);
    const outDir = dirname(outAbs);
    if (!validateDirectoryExistsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }
    if (stat.isDirectory()) {
        if (!validateDirectoryExistsSync(outAbs)) {
            fs.mkdirSync(outAbs, { recursive: true });
        }
        return;
    }
    if (isBinaryFileSync(srcAbs, size)) {
        const buffer = fs.readFileSync(srcAbs);
        fs.writeFileSync(outAbs, buffer, { mode });
        return;
    }
    const fileSrc = fs.readFileSync(srcAbs, 'utf-8');
    let output = fileSrc.replace(/(\r\n|\n|\r)/gm, os.EOL);
    if (!output.endsWith(os.EOL)) output += os.EOL;
    fs.writeFileSync(outAbs, output, { mode });
}

// Async version
export async function copyFilesDirAsync(filesBasePath: string, context: NetworkContext): Promise<void> {
    const skipDirName = context.clientType === "besu" ? "goquorum" : "besu";
    const absBase = resolvePath(filesBasePath);
    const rootEntries = await fsp.readdir(absBase);
    for (const entry of rootEntries) {
        if (skipDirName && entry === skipDirName) continue;
        const entryAbs = resolvePath(filesBasePath, entry);
        const stats: any = await fsp.stat(entryAbs);
        if (stats.isDirectory && stats.isDirectory()) {
            const subEntries = await fsp.readdir(entryAbs);
            for (const sub of subEntries) {
                const rel = joinPath(entry, sub);
                await _copySingleAsync(filesBasePath, rel, context);
            }
        } else {
            await _copySingleAsync(filesBasePath, entry, context);
        }
    }
}


async function _copySingleAsync(base: string, relPath: string, context: NetworkContext): Promise<void> {
    const srcAbs = resolvePath(base, relPath);
    const stat = await fsp.stat(srcAbs);
    const { mode, size } = stat;
    const outAbs = resolvePath(context.outputPath, relPath);
    const outDir = dirname(outAbs);
    if (!await validateDirectoryExistsAsync(outDir)) {
        await fsp.mkdir(outDir, { recursive: true });
    }
    if (stat.isDirectory()) {
        if (!await validateDirectoryExistsAsync(outAbs)) {
            await fsp.mkdir(outAbs, { recursive: true });
        }
        return;
    }
    if (isBinaryFileSync(srcAbs, size)) {
        const buffer = await fsp.readFile(srcAbs);
        await fsp.writeFile(outAbs, buffer, { mode });
        return;
    }
    const fileSrc = await fsp.readFile(srcAbs, "utf-8");
    let output = fileSrc.replace(/(\r\n|\n|\r)/gm, os.EOL);
    if (!output.endsWith(os.EOL)) output += os.EOL;
    await fsp.writeFile(outAbs, output, { mode });
}

export async function renderFileToDirAsync(basePath: string, filePath: string, context: NetworkContext): Promise<void> {
    if (!isValidPath(filePath)) {
        throw new Error(`[renderFileToDirAsync] Invalid template file path: ${filePath}`);
    }
    if (!await validateDirectoryExistsAsync(resolvePath(basePath))) {
        throw new Error(`The template base path '${basePath}' does not exist.`);
    }
    const templatePath = resolvePath(basePath, filePath);
    const outputPath = resolvePath(context.outputPath, filePath);
    if (!await _validateFileExistsAsync(templatePath)) {
        throw new Error(`The template does not exist at '${templatePath}'.`);
    }
    if (await _validateFileExistsAsync(outputPath)) {
        throw new Error(`It appears that an output file already exists at '${outputPath}'. Aborting.`);
    }
    const mode = (await fsp.stat(templatePath)).mode;
    const templateSrc = await fsp.readFile(templatePath, 'utf-8');
    let output = renderString(templateSrc, context).replace(/(\r\n|\n|\r)/gm, os.EOL);
    if (!output.endsWith(os.EOL)) output += os.EOL;
    const outputDirname = dirname(outputPath);
    if (!await validateDirectoryExistsAsync(outputDirname)) {
        await fsp.mkdir(outputDirname, { recursive: true });
    }
    await fsp.writeFile(outputPath, output, { mode });
}

export function renderFileToDir(basePath: string, filePath: string, context: NetworkContext): void {
    if (!isValidPath(filePath)) {
        throw new Error(`[renderFileToDir] Invalid template file path: ${filePath}`);
    }
    if (!validateDirectoryExistsSync(resolvePath(basePath))) {
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
    const templateSrc = fs.readFileSync(templatePath, 'utf-8');
    let output = renderString(templateSrc, context).replace(/(\r\n|\n|\r)/gm, os.EOL);
    if (!output.endsWith(os.EOL)) output += os.EOL;
    const outputDirname = dirname(outputPath);
    if (!validateDirectoryExistsSync(outputDirname)) {
        fs.mkdirSync(outputDirname, { recursive: true });
    }
    fs.writeFileSync(outputPath, output, { mode });
}


export async function validateDirectoryExistsAsync(path: string): Promise<boolean> {
    let stat;
    try {
        stat = await fsp.stat(path);
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


// Enhanced: Skip any nested client directories (besu/goquorum) that do not match selected clientType, at any depth
// NOTE: _walkDirAsync could be extended to support arbitrary pattern filtering and async queueing for large trees.
// Consider adding unit tests for edge cases (symlinks, permission errors, etc.)
async function* _walkDirAsync(dir: string, skipDirName?: string, basePath = ""): AsyncGenerator<string> {
    const entries = await fsp.readdir(resolvePath(dir));
    for (const entry of entries) {
        // Skip any directory named skipDirName, regardless of depth
        if (skipDirName && entry === skipDirName) {
            continue;
        }
        const fullPath = resolvePath(dir, entry);
        let stats: any;
        try {
            stats = await fsp.stat(fullPath);
        } catch (err) {
            // Optionally log or collect errors for skipped files (e.g., permission denied)
            continue;
        }
        const relativePath = joinPath(basePath, entry);
        const isDir = typeof stats.isDirectory === 'function' && stats.isDirectory();
        if (isDir) {
            // Recursively skip all subdirs named skipDirName
            if (skipDirName && entry === skipDirName) {
                continue;
            }
            yield* _walkDirAsync(fullPath, skipDirName, relativePath);
        } else {
            yield relativePath;
        }
    }
}

// Async file existence helpers
async function _validateFileExistsAsync(path: string): Promise<boolean> {
    let stat;
    try {
        stat = await fsp.stat(path);
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
