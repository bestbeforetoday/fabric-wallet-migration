/**
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from "fs";
import * as util from "util";
import * as path from "path";
import * as os from "os";
import _rimraf from "rimraf";
const rimraf = util.promisify(_rimraf);

export async function readFile(fileName: string): Promise<string> {
    const filePath = path.resolve(__dirname, fileName);
    const buffer = await fs.promises.readFile(filePath);
    return buffer.toString("utf8");
}

export function stripNewlines(text: string): string {
    return text.replace(/[\r\n]/g, "");
}

export async function createTempDir(): Promise<string> {
    const prefix = path.join(os.tmpdir() + path.sep);
    return await fs.promises.mkdtemp(prefix);
}

export async function rmdir(path: string): Promise<void> {
    await rimraf(path);
}

export function assertDefined<T>(value: T | undefined): T {
    if (value == undefined) {
        throw new Error("Expected a value but got undefined");
    }
    return value;
}
