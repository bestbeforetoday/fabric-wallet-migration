/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { X509WalletMixin, Identity, Wallet, FileSystemWallet } from "fabric-network";

import { newFileSystemWalletStoreV1, WalletStore } from "../src";
import { IdentityData } from "../src/FileSystemWalletStoreV1";
import { createTempDir, stripNewlines, readFile, rimraf, assertDefined } from "./TestUtils";

import { promises as fs } from "node:fs";
import * as path from "node:path";

const certificateFile = "certificate.pem";
const privateKeyFile = "privateKey.pem";

function bufferToObject(buffer: Buffer): IdentityData {
    const jsonObj = buffer.toString("utf8");
    return JSON.parse(jsonObj) as IdentityData;
}

function objectToBuffer(jsonObj: unknown): Buffer {
    const json = JSON.stringify(jsonObj);
    return Buffer.from(json, "utf8");
}

describe("FileSystemWalletStoreV1", () => {
    let identity: Identity;
    let x509Data: IdentityData;
    let hsmData: IdentityData;
    let wallet: Wallet;
    let store: WalletStore;
    let tempDir: string;

    async function removePrivateKeyFiles(label: string): Promise<void> {
        const identityDir = path.join(tempDir, label);
        const files = await fs.readdir(identityDir);
        const keyFiles = files.filter((file) => file.endsWith("-priv"));
        for (const file of keyFiles) {
            const filePath = path.join(identityDir, file);
            await fs.unlink(filePath);
        }
    }

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
                privateKey,
            },
        };

        hsmData = {
            type: "HSM-X.509",
            version: 1,
            mspId,
            credentials: {
                certificate,
            },
        };

        identity = X509WalletMixin.createIdentity(mspId, certificate, privateKey);

        store = await newFileSystemWalletStoreV1(tempDir);
    });

    afterEach(async () => {
        await rimraf(tempDir);
    });

    describe("get", () => {
        it("returns undefined for identity that does not exist", async () => {
            const result = await store.get("label");
            expect(result).toBeUndefined();
        });

        it("returns store data for X.509 identity", async () => {
            await wallet.import("label", identity);

            const buffer = await store.get("label");

            const result = bufferToObject(assertDefined(buffer));
            const privateKey = assertDefined(result.credentials.privateKey);
            result.credentials.privateKey = stripNewlines(privateKey);
            expect(result).toEqual(x509Data);
        });

        it("returns store data for HSM identity", async () => {
            await wallet.import("label", identity);
            await removePrivateKeyFiles("label");

            const buffer = await store.get("label");

            const result = bufferToObject(assertDefined(buffer));
            expect(result).toEqual(hsmData);
        });
    });

    describe("list", () => {
        it("returns empty array for empty wallet", async () => {
            const result = await store.list();
            expect(result).toHaveLength(0);
        });

        it("returns labels for non-empty wallet", async () => {
            await wallet.import("label", identity);

            const result = await store.list();

            expect(result).toEqual(["label"]);
        });

        it("ignores spurious files", async () => {
            const filePath = path.join(tempDir, "fail");
            await fs.writeFile(filePath, "");

            const result = await store.list();

            expect(result).toEqual([]);
        });

        it("ignores spurios subdirectories", async () => {
            const dirPath = path.join(tempDir, "fail");
            await fs.mkdir(dirPath);

            const result = await store.list();

            expect(result).toEqual([]);
        });
    });

    describe("put", () => {
        it("adds X.509 identity to wallet", async () => {
            const data = objectToBuffer(x509Data);

            await store.put("label", data);
            const result: Identity & { privateKey?: string } = await wallet.export("label");

            // Private keys may be reformatted
            result.privateKey = stripNewlines(result.privateKey ?? "");
            expect(result).toEqual(identity);
        });

        it("throws for HSM identity", async () => {
            const data = objectToBuffer(hsmData);

            const promise = store.put("label", data);

            await expect(promise).rejects.toThrow(hsmData.type);
        });
    });

    describe("remove", () => {
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
        });
    });
});
