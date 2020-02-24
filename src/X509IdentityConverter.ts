/**
 * SPDX-License-Identifier: Apache-2.0
 */

import { Identity } from "fabric-network";
import { IdentityConverter } from "./IdentityConverter";
import { IdentityData, X509IdentityData } from "./IdentityData";

export class X509IdentityConverter implements IdentityConverter {
    readonly identityType = "X509";
    readonly storeDataType = "X.509";

    identityToStoreData(identity: Identity): X509IdentityData {
        if (identity.type !== this.identityType) {
            throw new Error("Invalid identity type: " + identity.type);
        }

        const x509Identity: any = identity;

        return {
            type: this.storeDataType,
            version: 1,
            mspId: x509Identity.mspId,
            credentials: {
                certificate: x509Identity.certificate,
                privateKey: x509Identity.privateKey
            }
        };
    }
    
    storeDataToIdentity(storeData: IdentityData): Identity {
        if (storeData.type !== this.storeDataType) {
            throw new Error("Invalid identity type: " + storeData.type);
        }

        const x509StoreData = storeData as X509IdentityData;

        return {
            type: this.identityType,
            mspId: x509StoreData.mspId,
            certificate: x509StoreData.credentials.certificate,
            privateKey: x509StoreData.credentials.privateKey
        } as Identity;
    }
}
