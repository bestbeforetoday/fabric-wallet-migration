/**
 * SPDX-License-Identifier: Apache-2.0
 */

import { newFileSystemWalletStore } from "../src/WalletStores";
import { createTempDir, rmdir } from "./TestUtils";

describe("WalletStores", () => {
    it("throws if file system wallet directory does not exist", async () => {
        const dir = await createTempDir();
        await rmdir(dir);

        const f = newFileSystemWalletStore(dir);

        await expect(f).rejects.toThrow(dir);
    });
});
