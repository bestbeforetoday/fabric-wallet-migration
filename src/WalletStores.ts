/**
 * SPDX-License-Identifier: Apache-2.0
 */

import { FileSystemWallet } from "fabric-network";
import { WalletStoreAdapter } from "./WalletStoreAdapter";

export function newFileSystemWalletStore(directory: string) {
    const wallet = new FileSystemWallet(directory);
    return new WalletStoreAdapter(wallet);
}
