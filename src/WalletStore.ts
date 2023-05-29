/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { FileSystemWalletStoreV1 } from "./FileSystemWalletStoreV1";

export interface WalletStore {
    get(label: string): Promise<Buffer | undefined>;
    list(): Promise<string[]>;
    put(label: string, data: Buffer): Promise<void>;
    remove(label: string): Promise<void>;
}

/**
 * Creates a wallets store that can access a V1 file system wallet.
 * @param directory A directory path.
 * @returns A wallet store.
 */
export async function newFileSystemWalletStoreV1(directory: string): Promise<WalletStore> {
    return FileSystemWalletStoreV1.newInstance(directory);
}
