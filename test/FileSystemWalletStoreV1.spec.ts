/**
 * SPDX-License-Identifier: Apache-2.0
 */

import { X509WalletMixin, Identity, Wallet, FileSystemWallet } from "fabric-network";

import { FileSystemWalletStoreV1 } from "../src/FileSystemWalletStoreV1";
import { IdentityData } from "../src/IdentityData";

import fs = require("fs");
import util = require("util");
import path = require("path");
import os = require("os");
import _rimraf = require("rimraf");
const rimraf = util.promisify(_rimraf);

const certificateFile = "certificate.pem";
const privateKeyFile = "privateKey.pem";

function bufferToObject(buffer: Buffer): IdentityData {
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

async function createTempDir() {
    const prefix = path.join(os.tmpdir(), "wallet-");
    return await fs.promises.mkdtemp(prefix);
}

describe("FileSystemWalletStoreV1", () => {
    let identity: Identity;
    let x509Data: IdentityData;
    let hsmData: IdentityData;
    let wallet: Wallet;
    let store: FileSystemWalletStoreV1;
    let tempDir: string;

    beforeEach(async () => {
        tempDir = await createTempDir();
        wallet = new FileSystemWallet(tempDir);

        const mspId = "mspId";
        const certificate = stripNewlines(await readFile(certificateFile)).trim();
        const privateKey = stripNewlines(await readFile(privateKeyFile)).trim();

        x509Data = {
            type: "X.509",
            version: 1,
            mspId,
            credentials: {
                certificate,
                privateKey
            }
        };

        hsmData = {
            type: "HSM-X.509",
            version: 1,
            mspId,
            credentials: {
                certificate
            }
        };

        identity = X509WalletMixin.createIdentity(mspId, certificate, privateKey);

        store = new FileSystemWalletStoreV1(tempDir);
    });

    afterEach(async () => {
        await rimraf(tempDir);
    });

    async function removePrivateKeyFiles(label: string) {
        const identityDir = path.join(tempDir, label);
        const files = await fs.promises.readdir(identityDir);
        const keyFiles = files.filter((file) => file.endsWith("-priv"));
        for (const file of keyFiles) {
            const filePath = path.join(identityDir, file);
            await fs.promises.unlink(filePath);
        }
    }

    describe("#get", () => {
        it("returns undefined for identity that does not exist", async () => {
            const result = await store.get("label");
            expect(result).toBeUndefined;
        });

        it("returns store data for X.509 identity", async () => {
            await wallet.import("label", identity);

            const buffer = await store.get("label");

            expect(buffer).toBeDefined;
            const result = bufferToObject(buffer!);
            expect(result.credentials.privateKey).toBeDefined;
            result.credentials.privateKey = stripNewlines(result.credentials.privateKey!);
            expect(result).toEqual(x509Data);
        });

        it("returns store data for HSM identity", async () => {
            await wallet.import("label", identity);
            await removePrivateKeyFiles("label");

            const buffer = await store.get("label");

            expect(buffer).toBeDefined;
            const result = bufferToObject(buffer!);
            expect(result).toEqual(hsmData);
        });
    });

    describe("#list", () => {
        it("returns empty array for empty wallet", async () => {
            const result = await store.list();
            expect(result).toHaveLength(0);
        });

        it("returns labels for non-empty wallet", async () => {
            await wallet.import("label", identity);

            const result = await store.list();

            expect(result).toEqual(["label"]);
        });

        it("ignores spurios files", async () => {
            const filePath = path.join(tempDir, "fail");
            await fs.promises.writeFile(filePath, "");

            const result = await store.list();

            expect(result).toEqual([]);
        });

        it("ignores spurios subdirectories", async () => {
            const dirPath = path.join(tempDir, "fail");
            await fs.promises.mkdir(dirPath);

            const result = await store.list();

            expect(result).toEqual([]);
        });
    });

    describe("#put", () => {
        it("adds X.509 identity to wallet", async () => {
            const data = objectToBuffer(x509Data);

            await store.put("label", data);
            const result: any = await wallet.export("label");

            // Private keys may be reformatted
            result.privateKey = stripNewlines(result.privateKey);
            expect(result).toEqual(identity);
        });

        it("throws for HSM identity", async () => {
            const data = objectToBuffer(hsmData);

            const promise = store.put("label", data);

            await expect(promise).rejects.toThrow(hsmData.type);
        });
    });

    describe("#remove", () => {
        it("does nothing for non-existent identity", async () => {
            await store.remove("label");

            const result = await wallet.list();
            expect(result).toHaveLength(0);
        });

        it("removes identity from wallet", async () => {
            await wallet.import("label", identity);

            await store.remove("label");

            const result = await wallet.exists("label");
            expect(result).toBe(false);
        })
    });
});