/**
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
	name: string;
	mspid: string;
	enrollment: Enrollment;
}

export interface Enrollment {
	identity: {
		certificate: string;
	};
	signingIdentity: string;
}
