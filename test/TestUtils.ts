/**
 * SPDX-License-Identifier: Apache-2.0
 */

import fs = require("fs");
import util = require("util");
import path = require("path");
import os = require("os");
import _rimraf = require("rimraf");
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
