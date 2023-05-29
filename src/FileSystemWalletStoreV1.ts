/*
 * SPDX-License-Identifier: Apache-2.0
 */

import * as path from "node:path";
import { promises as fs } from "node:fs";
import * as crypto from "node:crypto";

const hsmType = "HSM-X.509";
const x509Type = "X.509";

export interface User {
    name: string;
    mspid: string;
    enrollment: Enrollment;
}

export interface Enrollment {
    identity: {
        certificate: string;
    };
    signingIdentity: string;
}

export interface IdentityData {
    type: "X.509" | "HSM-X.509";
    version: 1;
    credentials: {
        certificate: string;
        privateKey?: string;
    };
    mspId: string;
}

const encoding = "utf8";
const privateKeyExtension = "-priv";

export class FileSystemWalletStoreV1 {
    public static async newInstance(directory: string): Promise<FileSystemWalletStoreV1> {
        await fs.access(directory); // Throws if directory does not exist
        return new FileSystemWalletStoreV1(directory);
    }

    readonly #directory: string;

    constructor(directory: string) {
        this.#directory = directory;
    }

    async get(label: string): Promise<Buffer | undefined> {
        try {
            const user = await this.#getUser(label);
            const privateKey = await this.#getPrivateKey(user);
            const storeData = userToStoreData(user, privateKey);
            const json = JSON.stringify(storeData);
            return Buffer.from(json, encoding);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            return undefined;
        }
    }

    async list(): Promise<string[]> {
        const dirEntries = await fs.readdir(this.#directory, { withFileTypes: true });
        const labels = dirEntries.filter((dirEntry) => dirEntry.isDirectory()).map((dirEntry) => dirEntry.name);

        const results: string[] = [];
        for (const label of labels) {
            try {
                await this.#getUser(label);
                results.push(label);
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (error) {
                // Not a valid user
            }
        }

        return results;
    }

    async put(label: string, data: Buffer): Promise<void> {
        const json = data.toString(encoding);
        const storeData = JSON.parse(json) as IdentityData;
        const { user, privateKey } = storeDataToUser(storeData, label);

        await this.#createIdentityDir(label);
        await this.#writeUser(user, label);
        if (privateKey) {
            await this.#writePrivateKey(user, privateKey);
        }
    }

    async remove(label: string): Promise<void> {
        const identityDir = this.#getIdentityDir(label);
        await fs.rm(identityDir, { recursive: true, force: true });
    }

    async #getUser(label: string): Promise<User> {
        const userPath = this.#getUserPath(label);
        const userData = await fs.readFile(userPath);
        return JSON.parse(userData.toString(encoding)) as User;
    }

    #getUserPath(label: string): string {
        const identityDir = this.#getIdentityDir(label);
        return path.join(identityDir, label);
    }

    #getIdentityDir(label: string): string {
        return path.join(this.#directory, label);
    }

    async #getPrivateKey(user: User): Promise<string | undefined> {
        const keyPath = this.#getPrivateKeyPath(user);
        try {
            const keyData = await fs.readFile(keyPath);
            return keyData.toString(encoding).trim();
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            // No private key
            return undefined;
        }
    }

    #getPrivateKeyPath(user: User): string {
        const identityDir = this.#getIdentityDir(user.name);
        const file = user.enrollment.signingIdentity + privateKeyExtension;
        return path.join(identityDir, file);
    }

    async #createIdentityDir(label: string): Promise<void> {
        const identityDir = this.#getIdentityDir(label);
        await fs.mkdir(identityDir);
    }

    async #writeUser(user: User, label: string): Promise<void> {
        const userJson = JSON.stringify(user);
        const userData = Buffer.from(userJson);
        const userPath = this.#getUserPath(label);
        await fs.writeFile(userPath, userData);
    }

    async #writePrivateKey(user: User, privateKey: string): Promise<void> {
        const privateKeyPath = this.#getPrivateKeyPath(user);
        await fs.writeFile(privateKeyPath, privateKey);
    }
}

function userToStoreData(user: User, privateKey?: string): IdentityData {
    return {
        type: privateKey ? x509Type : hsmType,
        version: 1,
        mspId: user.mspid,
        credentials: {
            certificate: user.enrollment.identity.certificate,
            privateKey,
        },
    };
}

function storeDataToUser(
    storeData: IdentityData,
    label: string,
): {
    user: User;
    privateKey: string | undefined;
} {
    if (storeData.type !== x509Type) {
        throw new Error("Invalid identity type: " + storeData.type);
    }

    const user: User = {
        name: label,
        mspid: storeData.mspId,
        enrollment: {
            identity: {
                certificate: storeData.credentials.certificate,
            },
            signingIdentity: crypto.randomUUID(),
        },
    };
    const privateKey = storeData.credentials.privateKey;

    return { user, privateKey };
}
