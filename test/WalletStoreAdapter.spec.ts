/**
 * SPDX-License-Identifier: Apache-2.0
 */

import { X509WalletMixin, Identity, Wallet, InMemoryWallet } from "fabric-network";
import { X509IdentityData } from "../src/IdentityData";
import { WalletStoreAdapter } from "../src/WalletStoreAdapter";

import fs = require("fs");
import util = require("util");
import path = require("path");

const certificateFile = "certificate.pem";
const privateKeyFile = "privateKey.pem";

function bufferToObject(buffer: Buffer): any {
    const jsonObj = buffer.toString("utf8");
    return JSON.parse(jsonObj);
}

function objectToBuffer(jsonObj: any) {
    const json = JSON.stringify(jsonObj);
    return Buffer.from(json, "utf8");
}

async function readFile(fileName: string) {
    const readFileAsync = util.promisify(fs.readFile);
    const filePath = path.resolve(__dirname, fileName);
    const buffer = await readFileAsync(filePath);
    return buffer.toString("utf8");
}

function stripNewlines(text: string) {
    return text.replace(/[\r\n]/g, "");
}

describe("WalletStoreAdapter", () => {
    let identity: Identity;
    let storeData: X509IdentityData;
    let wallet = new InMemoryWallet();
    let store: WalletStoreAdapter;

    beforeEach(async () => {
        const certificate = stripNewlines(await readFile(certificateFile)).trim();
        const privateKey = stripNewlines(await readFile(privateKeyFile)).trim();

        storeData = {
            type: 'X.509',
            version: 1,
            mspId: 'mspId',
            credentials: {
                certificate,
                privateKey
            }
        };
        identity = X509WalletMixin.createIdentity(
            storeData.mspId,
            storeData.credentials.certificate,
            storeData.credentials.privateKey
        );

        store = new WalletStoreAdapter(wallet);
    });

    afterEach(async () => {
        const infos = await wallet.list();
        const labels = infos.map((info) => info.label);
        for (const label of labels) {
            await wallet.delete(label);
        }
    });

    describe("#get", () => {
        it("returns undefined for identity that does not exist", async () => {
            const result = await store.get("label");
            expect(result).toBeUndefined;
        });

        it('returns store data for identity', async () => {
            await wallet.import("label", identity);

            const buffer = await store.get("label");

            const result = bufferToObject(buffer!) as X509IdentityData;
            // Private keys may be reformatted
            result.credentials.privateKey = stripNewlines(result.credentials.privateKey);
            expect(result).toMatchObject(storeData);
        });
    });

    describe('#list', () => {
        it('returns empty array for empty wallet', async () => {
            const result = await store.list();
            expect(result).toHaveLength(0);
        });

        it('returns labels for non-empty wallet', async () => {
            await wallet.import("label", identity);

            const result = await store.list();

            expect(result).toEqual(["label"]);
        });
    });

    describe('#put', () => {
        it('adds identity to wallet', async () => {
            const data = objectToBuffer(storeData);

            await store.put("label", data);
            const result: any = await wallet.export("label");

            // Private keys may be reformatted
            result.privateKey = stripNewlines(result.privateKey);
            expect(result).toEqual(identity);
        });
    });

    describe('#remove', () => {
        it('does nothing for non-existent identity', async () => {
            await store.remove("label");

            const result = await wallet.list();
            expect(result).toHaveLength(0);
        });

        it('removes identity from wallet', async () => {
            await wallet.import("label", identity);

            await store.remove("label");

            const result = await wallet.exists("label");
            expect(result).toBe(false);
        })
    });
});