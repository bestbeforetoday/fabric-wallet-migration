/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { FileSystemWalletStoreV2 } from "./FileSystemWalletStoreV2";
import { Wallet } from "./Wallet";

/**
 * Create a V2 wallet backed by the provided file system directory.
 * @param directory A directory path.
 * @returns A wallet.
 */
export async function newFileSystemWallet(directory: string): Promise<Wallet> {
    const store = await FileSystemWalletStoreV2.newInstance(directory);
    return new Wallet(store);
}
