/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Identity, Wallet } from "../src";

import * as crypto from "node:crypto";
import { InMemoryWalletStore } from "./InMemoryWalletStore";

const utf8Decoder = new TextDecoder();

describe("Wallet", () => {
    const identity: Identity = {
        credentials: Buffer.from("CERTIFICATE"),
        mspId: "MSPID",
    };
    const { privateKey } = crypto.generateKeyPairSync("ec", { namedCurve: "P-256" });

    function newWallet(): Wallet {
        const store = new InMemoryWalletStore();
        return new Wallet(store);
    }

    it("list returns empty array for empty wallet", async () => {
        const wallet = newWallet();
        const result = await wallet.list();
        expect(result).toHaveLength(0);
    });

    it("list returns added entry", async () => {
        const wallet = newWallet();
        const label = "myId";

        await wallet.put(label, { identity, privateKey });
        const result = await wallet.list();

        expect(result).toEqual([label]);
    });

    it("list does not return removed entries", async () => {
        const wallet = newWallet();
        const label = "myId";

        await wallet.put(label, { identity, privateKey });
        await wallet.remove(label);
        const result = await wallet.list();

        expect(result).toHaveLength(0);
    });

    it("get returns undefined if entry does not exist", async () => {
        const wallet = newWallet();
        const result = await wallet.get("NO");
        expect(result).toBeUndefined();
    });

    it("get returns undefined for removed entry", async () => {
        const wallet = newWallet();
        const label = "myId";

        await wallet.put(label, { identity, privateKey });
        await wallet.remove(label);
        const result = await wallet.get(label);

        expect(result).toBeUndefined();
    });

    it("Get previously added entry", async () => {
        const wallet = newWallet();
        const label = "myId";

        await wallet.put(label, { identity, privateKey });
        const result = await wallet.get(label);

        expect(result).toMatchObject({ identity: { mspId: identity.mspId } });

        const credentials = utf8Decoder.decode(result?.identity.credentials);
        expect(credentials).toEqual(identity.credentials.toString());

        const jwk = result?.privateKey.export({ format: "jwk" });
        expect(jwk).toEqual(privateKey.export({ format: "jwk" }));
    });
});
