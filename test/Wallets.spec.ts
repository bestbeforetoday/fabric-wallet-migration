/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { wallets } from "../src";
import { nonExistentDirectory } from "./TestUtils";

import * as path from "node:path";

describe("Wallets", () => {
    it("creates empty wallet if file system wallet directory does not exist", async () => {
        const dir = await nonExistentDirectory();

        const store = await wallets.newFileSystemWallet(dir);

        const labels = await store.list();
        expect(labels).toHaveLength(0);
    });

    it("creates empty wallet if file system wallet parent directory does not exist", async () => {
        const parentdir = await nonExistentDirectory();
        const subdir = path.join(parentdir, "subdir");

        const store = await wallets.newFileSystemWallet(subdir);

        const labels = await store.list();
        expect(labels).toHaveLength(0);
    });
});
