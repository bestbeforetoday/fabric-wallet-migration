/**
 * SPDX-License-Identifier: Apache-2.0
 */

import { User } from "./User";
import { IdentityData } from "./IdentityData";

import uuid = require("uuid");

const hsmType = "HSM-X.509";
const x509Type = "X.509";

export class IdentityConverter implements IdentityConverter {
    userToStoreData(user: User, privateKey?: string): IdentityData {
        return {
            type: privateKey ? x509Type : hsmType,
            version: 1,
            mspId: user.mspid,
            credentials: {
                certificate: user.enrollment.identity.certificate,
                privateKey
            }
        };
    }

    storeDataToUser(storeData: IdentityData, label: string): {
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
                signingIdentity: uuid.v4()
            }
        };
        const privateKey = storeData.credentials.privateKey;

        return { user, privateKey };
    }
}
