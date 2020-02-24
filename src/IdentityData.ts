/**
 * SPDX-License-Identifier: Apache-2.0
 */

export interface IdentityData {
	readonly type: string;
	readonly version: number;
}

export interface X509IdentityData extends IdentityData {
	type: 'X.509';
	version: 1;
	credentials: {
		certificate: string;
		privateKey: string;
	};
	mspId: string;
}

export interface HsmX509IdentityData extends IdentityData {
	type: 'HSM-X.509';
	version: 1;
	credentials: {
		certificate: string;
	};
	mspId: string;
}
