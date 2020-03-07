/**
 * SPDX-License-Identifier: Apache-2.0
 */

import { FileSystemWalletStoreV1 } from "./FileSystemWalletStoreV1";

interface WalletStore {
    get(label: string): Promise<Buffer | undefined>;
    list(): Promise<string[]>;
    put(label: string, data: Buffer): Promise<void>;
    remove(label: string): Promise<void>;
}

export function newFileSystemWalletStore(directory: string): WalletStore {
    return new FileSystemWalletStoreV1(directory);
}
