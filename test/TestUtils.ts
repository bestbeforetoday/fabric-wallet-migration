/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { promises as fs } from "fs";
import * as os from "os";
import * as path from "path";

export async function readFile(fileName: string): Promise<string> {
    const filePath = path.resolve(__dirname, fileName);
    const buffer = await fs.readFile(filePath);
    return buffer.toString("utf8");
}

export function stripNewlines(text: string): string {
    return text.replace(/[\r\n]/g, "");
}

export async function createTempDir(): Promise<string> {
    const prefix = path.join(os.tmpdir() + path.sep);
    return await fs.mkdtemp(prefix);
}

export async function nonExistentDirectory(): Promise<string> {
    const dir = await createTempDir();
    await rimraf(dir);
    return dir;
}

export async function rimraf(path: string): Promise<void> {
    await fs.rm(path, { recursive: true, force: true });
}

export function assertDefined<T>(value: T | undefined): T {
    if (value == undefined) {
        throw new Error("Expected a value but got undefined");
    }
    return value;
}
