/**
 * SPDX-License-Identifier: Apache-2.0
 */

import { User } from "./User";
import { IdentityConverter } from "./IdentityConverter";
import { IdentityData } from "./IdentityData";

import path = require("path");
import fs = require("fs");
import util = require("util");
import _rimraf = require("rimraf");
const rimraf = util.promisify(_rimraf);

const encoding = "utf8";
const privateKeyExtension = "-priv";

export class FileSystemWalletStoreV1 {
    private readonly directory: string;
    private readonly converter = new IdentityConverter();

    constructor(directory: string) {
        this.directory = directory;
    }

    async get(label: string): Promise<Buffer | undefined> {
        try {
            const user = await this.getUser(label);
            const privateKey = await this.getPrivateKey(user);
            const storeData = this.converter.userToStoreData(user, privateKey);
            const json = JSON.stringify(storeData);
            return Buffer.from(json, encoding);
        } catch (error) {
            return undefined;
        }
    }

    async list(): Promise<string[]> {
        const dirEntries = await fs.promises.readdir(this.directory, { withFileTypes: true });
        const labels = dirEntries
            .filter((dirEntry) => dirEntry.isDirectory())
            .map((dirEntry) => dirEntry.name);

        const results: string[] = [];
        for (const label of labels) {
            try {
                await this.getUser(label);
                results.push(label);
            } catch (error) {
                // Not a valid user
            }
        }

        return results;
    }

    async put(label: string, data: Buffer): Promise<void> {
        const json = data.toString(encoding);
        const storeData = JSON.parse(json) as IdentityData;
        const { user, privateKey } = this.converter.storeDataToUser(storeData, label);

        await this.createIdentityDir(label);
        await this.writeUser(user, label);
        if (privateKey) {
            await this.writePrivateKey(user, privateKey);
        }
    }

    async remove(label: string): Promise<void> {
        const identityDir = this.getIdentityDir(label);
        await rimraf(identityDir);
    }

    private async getUser(label: string): Promise<User> {
        const userPath = this.getUserPath(label);
        const userData = await fs.promises.readFile(userPath);
        return JSON.parse(userData.toString(encoding));
    }

    private getUserPath(label: string): string {
        const identityDir = this.getIdentityDir(label);
        return path.join(identityDir, label);
    }

    private getIdentityDir(label: string): string {
        return path.join(this.directory, label);
    }

    private async getPrivateKey(user: User): Promise<string | undefined> {
        const keyPath = this.getPrivateKeyPath(user);
        try {
            const keyData = await fs.promises.readFile(keyPath);
            return keyData.toString(encoding).trim();
        } catch (error) {
            // No private key
            return undefined;
        }
    }

    private getPrivateKeyPath(user: User): string {
        const identityDir = this.getIdentityDir(user.name);
        const file = user.enrollment.signingIdentity + privateKeyExtension;
        return path.join(identityDir, file);
    }

    private async createIdentityDir(label: string): Promise<void> {
        const identityDir = this.getIdentityDir(label);
        await fs.promises.mkdir(identityDir);
    }

    private async writeUser(user: User, label: string): Promise<void> {
        const userJson = JSON.stringify(user);
        const userData = Buffer.from(userJson);
        const userPath = this.getUserPath(label);
        await fs.promises.writeFile(userPath, userData);
    }

    private async writePrivateKey(user: User, privateKey: string): Promise<void> {
        const privateKeyPath = this.getPrivateKeyPath(user);
        await fs.promises.writeFile(privateKeyPath, privateKey);
    }
}