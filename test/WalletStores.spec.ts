/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { newFileSystemWalletStoreV1 } from "../src";
import { nonExistentDirectory } from "./TestUtils";

describe("WalletStores", () => {
    it("throws if V1 file system wallet directory does not exist", async () => {
        const dir = await nonExistentDirectory();

        const promise = newFileSystemWalletStoreV1(dir);

        await expect(promise).rejects.toThrow(dir);
    });
});
