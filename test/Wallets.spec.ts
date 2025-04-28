/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { wallets } from "../src";
import { nonExistentDirectory } from "./TestUtils";

import * as path from "node:path";

describe("Wallets", () => {
    it("creates empty wallet if file system wallet directory does not exist", async () => {
        const dir = await nonExistentDirectory();

        const wallet = await wallets.newFileSystemWallet(dir);

        const labels = await wallet.list();
        expect(labels).toHaveLength(0);
    });

    it("creates empty wallet if file system wallet parent directory does not exist", async () => {
        const parentdir = await nonExistentDirectory();
        const subdir = path.join(parentdir, "subdir");

        const wallet = await wallets.newFileSystemWallet(subdir);

        const labels = await wallet.list();
        expect(labels).toHaveLength(0);
    });
});
