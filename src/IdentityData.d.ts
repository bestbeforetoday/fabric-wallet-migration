/**
 * SPDX-License-Identifier: Apache-2.0
 */

export interface IdentityData {
	type: "X.509" | "HSM-X.509";
	version: 1;
	credentials: {
		certificate: string;
		privateKey?: string;
	};
	mspId: string;
}
