/**
 * SPDX-License-Identifier: Apache-2.0
 */

import * as WalletMigration from "fabric-wallet-migration";
import { Wallet, Wallets, X509Identity } from "fabric-network";

import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const oldWalletPath = path.resolve(__dirname, "..", "..", "fixtures", "wallet-v1");

describe("Wallet migration", () => {
    let newWalletPath: string;
    let oldWallet: Wallet;
    let newWallet: Wallet;

    async function createTempDir(): Promise<string> {
        const prefix = path.join(os.tmpdir(), path.sep);
        return await fs.mkdtemp(prefix);
    }

    async function migrate(oldWallet: Wallet, newWallet: Wallet): Promise<string[]> {
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

    async function getAll(wallet: Wallet): Promise<Map<string, X509Identity>> {
        const identities = new Map<string, X509Identity>();

        const labels = await wallet.list();
        for (const label of labels) {
            const identity = await wallet.get(label);
            if (identity) {
                identities.set(label, identity as X509Identity);
            }
        }

        return identities;
    }

    beforeAll(async () => {
        const walletStore = await WalletMigration.newFileSystemWalletStoreV1(oldWalletPath);
        oldWallet = new Wallet(walletStore);

        newWalletPath = await createTempDir();
        newWallet = await Wallets.newFileSystemWallet(newWalletPath);

        await migrate(oldWallet, newWallet);
    });

    afterAll(async () => {
        await fs.rm(newWalletPath, { recursive: true, force: true });
    });

    it("has expected labels", async () => {
        const labels = await newWallet.list();
        expect(labels).toEqual(["user1", "user2"]);
    });

    it("contains X.509 identities", async () => {
        const identities = await getAll(newWallet);
        identities.forEach((identity) => {
            expect(identity.type).toEqual("X.509");
        });
    });

    it("identities have matching certificates", async () => {
        const identities = await getAll(newWallet);
        identities.forEach((identity) => {
            expect(identity.credentials.certificate).toMatch(/.+/);
        });
    });

    it("identities have non-empty private keys", async () => {
        const identities = await getAll(newWallet);
        identities.forEach((identity) => {
            expect(identity.credentials.privateKey).toMatch(/.+/);
        });
    });

    it("identities match", async () => {
        const oldIdentities = await getAll(oldWallet);
        const newIdentities = await getAll(newWallet);

        oldIdentities.forEach((oldIdentity, label) => {
            const newIdentity = newIdentities.get(label);
            expect(newIdentity).toEqual(oldIdentity);
        });
    });
});
