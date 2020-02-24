/**
 * SPDX-License-Identifier: Apache-2.0
 */

import { Identity } from "fabric-network";
import { IdentityData } from "./IdentityData";

export interface IdentityConverter {
    readonly identityType: string;
    readonly storeDataType: string;
    identityToStoreData(identity: Identity): IdentityData;
    storeDataToIdentity(storeData: IdentityData): Identity;
}