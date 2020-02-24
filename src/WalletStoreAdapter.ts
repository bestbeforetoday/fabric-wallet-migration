/**
 * SPDX-License-Identifier: Apache-2.0
 */

import { Wallet } from "fabric-network";
import { X509IdentityConverter } from "./X509IdentityConverter";
import { IdentityData } from "./IdentityData";

export class WalletStoreAdapter {
    private readonly wallet: Wallet;
    private readonly converter = new X509IdentityConverter();

    constructor(wallet: Wallet) {
        this.wallet = wallet;
    }

	async get(label: string): Promise<Buffer | undefined> {
        const identity = await this.wallet.export(label);
        if (!identity) {
            return undefined;
        }
        
        const storeData = this.converter.identityToStoreData(identity);
        const json = JSON.stringify(storeData);
        return Buffer.from(json, "utf8");
    }

	async list(): Promise<string[]> {
        const infos = await this.wallet.list();
        return infos.map((info) => info.label);
    }

	async put(label: string, data: Buffer): Promise<void> {
        const json = data.toString("utf8");
        const storeData = JSON.parse(json) as IdentityData;
        const identity = this.converter.storeDataToIdentity(storeData);
        await this.wallet.import(label, identity);
    }

	async remove(label: string): Promise<void> {
        await this.wallet.delete(label);
    }
}