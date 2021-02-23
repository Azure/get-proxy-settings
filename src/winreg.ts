import { execFile } from "child_process";
import * as path from "path";

const ITEM_PATTERN = /^(.*)\s(REG_SZ|REG_MULTI_SZ|REG_EXPAND_SZ|REG_DWORD|REG_QWORD|REG_BINARY|REG_NONE)\s+([^\s].*)$/;

export enum Hive {
    HKCU = "HKCU",
}

function getRegPath() {
    if (process.platform === "win32" && process.env.windir) {
        return path.join(process.env.windir as string, "system32", "reg.exe");
    } else {
        return "REG";
    }
}

interface ExecOutput {
    stdout: string;
    stderr: string;
}

async function execAsync(
    command: string,
    args: string[] = []
): Promise<ExecOutput> {
    return new Promise<ExecOutput>((resolve, reject) => {
        execFile(command, args, (err, stdout, stderr) => {
            if (err) {
                reject(err);
            } else {
                resolve({ stdout, stderr });
            }
        });
    });
}

export interface RegEntry {
    type: string;
    value: string;
}

export interface RegKeyValues {
    [name: string]: RegEntry;
}

function parseOutput(stdout: string): RegKeyValues {
    const lines = stdout.split("\n");
    const result = {};
    for (const line of lines.slice(1)) {
        const match = ITEM_PATTERN.exec(line.trim());
        if (match) {
            const name = match[1].trim();
            const type = match[2].trim();
            const value = match[3].trim();
            result[name] = { type, value };
        }
    }
    return result;
}

export async function openKey(
    hive: string,
    key: string
): Promise<RegKeyValues> {
    const keyPath = `${hive}\\${key}`;
    const { stdout } = await execAsync(getRegPath(), ["query", keyPath]);
    const values = parseOutput(stdout);
    return values;
}
