/**
 * SPDX-License-Identifier: Apache-2.0
 */

import * as WalletMigration from "fabric-wallet-migration";
import { Wallet, Wallets, Identity, X509Identity } from "fabric-network";

import * as fs  from "fs";
import * as os from "os";
import * as path from "path";
import * as util from "util";
import _rimraf from "rimraf";
const rimraf = util.promisify(_rimraf);

const oldWalletPath = path.resolve(__dirname, "..", "wallet");

async function createTempDir(): Promise<string> {
    const prefix = path.join(os.tmpdir(), path.sep);
    return await fs.promises.mkdtemp(prefix);
}

describe("Wallet migration", () => {
    let walletPath: string;
    let wallet: Wallet;

    async function migrate(): Promise<string[]> {
        const walletStore = await WalletMigration.newFileSystemWalletStore(oldWalletPath);
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

    async function getAll(): Promise<Map<string, Identity>> {
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

    beforeAll(async () => {
        walletPath = await createTempDir();
        await migrate();
        wallet = await Wallets.newFileSystemWallet(walletPath);
    });

    afterAll(async () => {
        await rimraf(walletPath);
    });

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
