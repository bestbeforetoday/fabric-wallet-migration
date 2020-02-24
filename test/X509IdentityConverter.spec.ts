/**
 * SPDX-License-Identifier: Apache-2.0
 */

import { X509WalletMixin, Identity } from "fabric-network";
import { X509IdentityData } from "../src/IdentityData";
import { X509IdentityConverter } from "../src/X509IdentityConverter";

describe("X509IdentityConverter", () => {
    let identity: Identity;
    let converter: X509IdentityConverter;
    let storeData: X509IdentityData;

    beforeEach(() => {
        storeData = {
            type: 'X.509',
            version: 1,
            mspId: 'mspId',
            credentials: {
                certificate: 'certificate',
                privateKey: 'privateKey'
            }
        };
        identity = X509WalletMixin.createIdentity(
            storeData.mspId,
            storeData.credentials.certificate,
            storeData.credentials.privateKey
        );
        converter = new X509IdentityConverter();
    });

    describe("#identityToStoreData", () => {
        it("throws with invalid identity type", () => {
            identity.type = "INVALID_TYPE";
            expect(() => converter.identityToStoreData(identity))
                .toThrow(identity.type);
        });

        it("converts valid identity to store data", () => {
            const result = converter.identityToStoreData(identity);
            expect(result).toEqual(storeData);
        });
    });

    describe("#storeDataToIdentity", () => {
        it("throws with invalid store data type", () => {
            (storeData as any).type = "INVALID_TYPE";
            expect(() => converter.storeDataToIdentity(storeData))
                .toThrow(storeData.type);
        });

        it("converts valid store data to identity", () => {
            const result = converter.storeDataToIdentity(storeData);
            expect(result).toEqual(identity);
        });
    });
});