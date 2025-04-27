/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { newFileSystemWalletStoreV1, Wallet, WalletStore } from "../src";
import { FileSystemWalletStoreV2 } from "../src/FileSystemWalletStoreV2";

import * as path from "node:path";

const testWalletV1Path = path.join(__dirname, "..", "fixtures", "wallet-v1");
const testWalletV2Path = path.join(__dirname, "..", "fixtures", "wallet-v2");

const stores: { [name: string]: () => Promise<WalletStore> } = {
    v1: () => newFileSystemWalletStoreV1(testWalletV1Path),
    v2: () => FileSystemWalletStoreV2.newInstance(testWalletV2Path),
};

Object.entries(stores).forEach(([name, newStore]) => {
    describe(`${name} interop`, () => {
        let wallet: Wallet;
        let labels: string[];

        beforeAll(async () => {
            const store = await newStore();
            wallet = new Wallet(store);
            labels = await wallet.list();
        });

        it("Wallet is not empty", () => {
            expect(labels).not.toHaveLength(0);
        });

        it("Read identities", async () => {
            for (const label of labels) {
                const entry = await wallet.get(label);
                expect(entry).toBeDefined();
                expect(entry?.identity.credentials).toBeDefined();
                expect(entry?.identity.mspId).toBeDefined();
                expect(entry?.privateKey).toBeDefined();
            }
        });
    });
});
