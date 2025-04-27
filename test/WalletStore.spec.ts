/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { WalletStore } from "../src";
import { FileSystemWalletStoreV2 } from "../src/FileSystemWalletStoreV2";
import { createTempDir, nonExistentDirectory, rimraf } from "./TestUtils";

import { promises as fs } from "node:fs";
import * as path from "node:path";

describe("WalletStore", () => {
    let tmpDir: string | undefined;
    const stores: { [k: string]: () => Promise<WalletStore> } = {
        FileSystemWalletStore: async () => {
            tmpDir = await createTempDir();
            return await FileSystemWalletStoreV2.newInstance(tmpDir);
        },
    };

    async function deleteTmpDir(): Promise<void> {
        if (tmpDir) {
            await rimraf(tmpDir);
            tmpDir = undefined;
        }
    }

    afterEach(async () => {
        await deleteTmpDir();
    });

    describe("Common", () => {
        Object.entries(stores).forEach(([name, newStore]) => {
            // eslint-disable-next-line jest/valid-title
            describe(name, () => {
                let store: WalletStore;
                const data = Buffer.from("DATA");

                beforeEach(async () => {
                    store = await newStore();
                });

                afterEach(async () => {
                    await deleteTmpDir();
                });

                it("empty wallet contains no labels", async () => {
                    const result = await store.list();
                    expect(result).toHaveLength(0);
                });

                it("labels include added identities", async () => {
                    const label = "label";

                    await store.put(label, data);
                    const result = await store.list();

                    expect(result).toEqual([label]);
                });

                it("labels do not include removed identities", async () => {
                    const label = "label";

                    await store.put(label, data);
                    await store.remove(label);
                    const result = await store.list();

                    expect(result).toHaveLength(0);
                });

                it("get returns undefined if identity does not exist", async () => {
                    const result = await store.get("MISSING");
                    expect(result).toBeUndefined();
                });

                it("get returns undefined for removed identity", async () => {
                    const label = "label";

                    await store.put(label, data);
                    await store.remove(label);
                    const result = await store.get(label);

                    expect(result).toBeUndefined();
                });

                it("get an imported identity", async () => {
                    const label = "label";

                    await store.put(label, data);
                    const result = await store.get(label);

                    expect(result).toBeDefined();
                    expect(result?.toString() ?? "").toEqual(data.toString());
                });
            });
        });
    });

    describe("FileSystemWalletStore", () => {
        it("does not list non-identity files", async () => {
            const store = await stores.FileSystemWalletStore();
            if (!tmpDir) {
                throw new Error("tmpDir not set");
            }
            const file = path.join(tmpDir, "BAD_FILE");
            await fs.writeFile(file, Buffer.from(""));

            const result = await store.list();

            expect(result).toBeDefined();
        });

        it("Recursively creates store directory if does not exist", async () => {
            const label = "label";
            const data = Buffer.from("DATA");
            const walletDir = await nonExistentDirectory();

            const store = await FileSystemWalletStoreV2.newInstance(walletDir);
            await store.put(label, data);
            const result = await store.get(label);

            expect(result).toBeDefined();
            expect(result?.toString() ?? "").toEqual(data.toString());
        });
    });
});
