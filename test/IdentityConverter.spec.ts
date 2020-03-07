/**
 * SPDX-License-Identifier: Apache-2.0
 */

import { User } from "../src/User";
import { IdentityData } from "../src/IdentityData";
import { IdentityConverter } from "../src/IdentityConverter";

describe("IdentityConverter", () => {
    let user: User;
    let converter: IdentityConverter;
    let x509Data: IdentityData;
    let hsmData: IdentityData;

    beforeEach(() => {
        const mspId = "mspId";
        const certificate = "certificate";
        const privateKey = "privateKey";

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

        user = {
            name: "user",
            mspid: mspId,
            enrollment: {
                identity: {
                    certificate
                },
                signingIdentity: "id"
            }
        };

        converter = new IdentityConverter();
    });

    describe("#userToStoreData", () => {
        it("converts X.509 user to store data", () => {
            const result = converter.userToStoreData(user, x509Data.credentials.privateKey);
            expect(result).toEqual(x509Data);
        });

        it("converts HSM user to store data", () => {
            const result = converter.userToStoreData(user, undefined);
            expect(result).toEqual(hsmData);
        });
    });

    describe("#storeDataToUser", () => {
        it("throws with invalid store data type", () => {
            (x509Data as any).type = "INVALID_TYPE"; // eslint-disable-line @typescript-eslint/no-explicit-any
            expect(() => converter.storeDataToUser(x509Data, user.name))
                .toThrow(x509Data.type);
        });

        it("converts X.509 store data to identity", () => {
            const result = converter.storeDataToUser(x509Data, user.name);

            user.enrollment.signingIdentity = expect.stringMatching(/.+/);
            expect(result.user).toMatchObject(user);
            expect(result.privateKey).toEqual(x509Data.credentials.privateKey);
        });
    });
});