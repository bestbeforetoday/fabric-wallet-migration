/**
 * SPDX-License-Identifier: Apache-2.0
 */

import { FileSystemWalletStoreV1 } from "./FileSystemWalletStoreV1";

export function newFileSystemWalletStore(directory: string) {
    return new FileSystemWalletStoreV1(directory);
}
