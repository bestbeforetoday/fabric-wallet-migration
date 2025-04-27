/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";

import { WalletStore } from "./WalletStore";

const suffix = ".id";

export class FileSystemWalletStoreV2 implements WalletStore {
    public static async newInstance(directory: string): Promise<FileSystemWalletStoreV2> {
        await fs.mkdir(directory, { recursive: true });
        return new FileSystemWalletStoreV2(directory);
    }

    readonly #storePath: string;

    private constructor(directory: string) {
        this.#storePath = directory;
    }

    public async remove(label: string): Promise<void> {
        const file = this.toPath(label);
        await fs.unlink(file);
    }

    public async get(label: string): Promise<Buffer | undefined> {
        const file = this.toPath(label);
        try {
            return await fs.readFile(file);
        } catch {
            return undefined;
        }
    }

    public async list(): Promise<string[]> {
        return (await fs.readdir(this.#storePath)).filter(isIdentityFile).map(toLabel);
    }

    public async put(label: string, data: Buffer): Promise<void> {
        const file = this.toPath(label);
        await fs.writeFile(file, data);
    }

    private toPath(label: string): string {
        return path.join(this.#storePath, label + suffix);
    }
}

function isIdentityFile(file: string): boolean {
    return file.endsWith(suffix);
}

function toLabel(file: string): string {
    const endIndex = file.length - suffix.length;
    return file.substring(0, endIndex);
}
