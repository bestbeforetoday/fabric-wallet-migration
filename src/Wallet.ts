/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Entry, IdentityData } from "./Identity";
import { WalletStore } from "./WalletStore";
import { fromJson, toJson } from "./Identity";

const encoding = "utf8";

/**
 * Stores identity information for use with the Fabric Gateway client API. The wallet is backed by a store that handles
 * persistence of identity information.
 */
export class Wallet {
    readonly #store: WalletStore;

    /**
     * Create a wallet instance backed by a given store. This can be used to create a wallet using your own custom
     * store implementation.
     * @param store Backing store implementation.
     */
    public constructor(store: WalletStore) {
        this.#store = store;
    }

    /**
     * Put an identity and private key into the wallet.
     * @param label Label used to identify the identity within the wallet.
     * @param identity Identity to store in the wallet.
     */
    public async put(label: string, entry: Entry): Promise<void> {
        const json = toJson(entry.identity, entry.privateKey);
        const jsonString = JSON.stringify(json);
        const buffer = Buffer.from(jsonString, encoding);
        await this.#store.put(label, buffer);
    }

    /**
     * Get an identity and private key from the wallet.
     * @param label Label used to identify the identity within the wallet.
     * @returns An identity if it exists; otherwise undefined.
     */
    public async get(label: string): Promise<Entry | undefined> {
        const buffer = await this.#store.get(label);
        if (!buffer) {
            return undefined;
        }

        const jsonString = buffer.toString(encoding);
        const json = JSON.parse(jsonString) as IdentityData;
        return fromJson(json);
    }

    /**
     * Get the labels of all identities in the wallet.
     * @returns Identity labels.
     */
    public async list(): Promise<string[]> {
        return await this.#store.list();
    }

    /**
     * Remove an entry from the wallet.
     * @param label Label used to identify the identity within the wallet.
     */
    public async remove(label: string): Promise<void> {
        await this.#store.remove(label);
    }
}
