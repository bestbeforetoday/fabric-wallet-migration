/**
 * SPDX-License-Identifier: Apache-2.0
 */

import { WalletStores } from "fabric-wallet-migration";
import { Wallet, Wallets, Identity, X509Identity } from "fabric-network";

import fs = require("fs");
import os = require("os");
import path = require("path");
import util = require("util");
import _rimraf = require("rimraf");
const rimraf = util.promisify(_rimraf);

const oldWalletPath = path.resolve(__dirname, "..", "wallet");

async function createTempDir() {
    const prefix = path.join(os.tmpdir(), "wallet-");
    return await fs.promises.mkdtemp(prefix);
}

describe("Wallet migration", () => {
    let walletPath: string;
    let wallet: Wallet;

    beforeAll(async () => {
        walletPath = await createTempDir();
        await migrate();
        wallet = await Wallets.newFileSystemWallet(walletPath);
    });

    afterAll(async () => {
        await rimraf(walletPath);
    });

    async function migrate() {
        const walletStore = WalletStores.newFileSystemWalletStore(oldWalletPath);
        const oldWallet = new Wallet(walletStore);

        const newWallet = await Wallets.newFileSystemWallet(walletPath);

        const migratedLabels: string[] = [];
        const identityLabels = await oldWallet.list();
        for (const label of identityLabels) {
            const identity = await oldWallet.get(label);
            if (identity) {
                await newWallet.put(label, identity);
                migratedLabels.push(label);
            }
        }

        return migratedLabels;
    }

    async function getAll() {
        const identities = new Map<string, Identity>();

        const labels = await wallet.list();
        for (const label of labels) {
            const identity = await wallet.get(label);
            if (identity) {
                identities.set(label, identity);
            }
        }

        return identities;
    }

    it("has expected labels", async () => {
        const labels = await wallet.list();
        expect(labels).toEqual(["user1", "user2"]);
    });

    it("contains X.509 identities", async () => {
        const identities = await getAll();
        identities.forEach((identity) => {
            expect(identity.type).toEqual("X.509");
        });
    });

    it("identities have non-empty certificates", async () => {
        const identities = await getAll();
        identities.forEach((identity) => {
            const x509Identity = identity as X509Identity;
            expect(x509Identity.credentials.certificate).toMatch(/.+/);
        });
    });

    it("identities have non-empty private keys", async () => {
        const identities = await getAll();
        identities.forEach((identity) => {
            const x509Identity = identity as X509Identity;
            expect(x509Identity.credentials.privateKey).toMatch(/.+/);
        });
    });
});
