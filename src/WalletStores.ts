/**
 * SPDX-License-Identifier: Apache-2.0
 */

import { FileSystemWalletStoreV1 } from "./FileSystemWalletStoreV1";

import * as fs from "fs";

export interface WalletStore {
    get(label: string): Promise<Buffer | undefined>;
    list(): Promise<string[]>;
    put(label: string, data: Buffer): Promise<void>;
    remove(label: string): Promise<void>;
}

export async function newFileSystemWalletStore(directory: string): Promise<WalletStore> {
    await fs.promises.access(directory); // Throws if directory does not exist
    return new FileSystemWalletStoreV1(directory);
}
