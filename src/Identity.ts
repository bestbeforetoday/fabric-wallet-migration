/*
 * SPDX-License-Identifier: Apache-2.0
 */

import * as crypto from "node:crypto";

const utf8Decoder = new TextDecoder();
const utf8Encoder = new TextEncoder();

export interface Identity {
    credentials: Uint8Array;
    mspId: string;
}

export interface Entry {
    identity: Identity;
    privateKey: crypto.KeyObject;
}

export interface IdentityData {
    readonly type: string;
    readonly version: number;
}

interface X509IdentityData extends IdentityData {
    type: "X.509";
    version: 1;
    credentials: {
        certificate: string;
        privateKey: string;
    };
    mspId: string;
}

export function toJson(identity: Identity, privateKey: crypto.KeyObject): X509IdentityData {
    return {
        credentials: {
            certificate: utf8Decoder.decode(identity.credentials),
            privateKey: privateKeyString(privateKey),
        },
        mspId: identity.mspId,
        type: "X.509",
        version: 1,
    };
}

function privateKeyString(privateKey: crypto.KeyObject): string {
    const exportedKey = privateKey.export({
        type: "pkcs8",
        format: "pem",
    });

    return asString(exportedKey);
}

function asString(value: string | Buffer): string {
    if (typeof value === "string") {
        return value;
    }

    return utf8Decoder.decode(value);
}

export function fromJson(data: IdentityData): Entry {
    if (!isX509IdentityData(data)) {
        throw new Error(`Unsupported identity type: ${data.type}`);
    }

    return fromX509Json(data);
}

function isX509IdentityData(data: IdentityData): data is X509IdentityData {
    return data.type === "X.509";
}

function fromX509Json(data: X509IdentityData): Entry {
    return {
        identity: {
            credentials: utf8Encoder.encode(data.credentials.certificate),
            mspId: data.mspId,
        },
        privateKey: crypto.createPrivateKey(data.credentials.privateKey),
    };
}
