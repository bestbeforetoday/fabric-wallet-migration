This module allows access to data stored in the wallets used by legacy Hyperledger Fabric client SDKs.

For users of the Fabric version 2 Node SDK, a custom WalletStore implementation that allows a Hyperledger Fabric version 1.4 wallet to be accessed using the version 2.x SDKs Wallet API. This can be used to migrate a version 1.4 wallet to the version 2 wallet format.

For users of the [Fabric Gateway client API](https://hyperledger.github.io/fabric-gateway/), a custom Wallet API implementation is provided that allows data to be directly accessed from legacy Node SDK wallets in a form suitable for use with the Fabric Gateway client API.

## Example migration from v1.4 to v2 wallet format

```TypeScript
import * as WalletMigration from "fabric-wallet-migration";
import { Wallet, Wallets } from "fabric-network"; // fabric-network v2

async function migrateWallet(oldWalletDirectory: string, newWalletDirectory: string): Promise<void> {
    const walletStore = await WalletMigration.newFileSystemWalletStoreV1(oldWalletDirectory);
    const oldWallet = new Wallet(walletStore);

    const newWallet = await Wallets.newFileSystemWallet(newWalletDirectory);

    const identityLabels = await oldWallet.list();
    for (const label of identityLabels) {
        const identity = await oldWallet.get(label);
        if (identity) {
        await newWallet.put(label, identity);
        }
    }
}
```

## Example use of v2 wallet with Fabric Gateway client API

```TypeScript
import * as grpc from "@grpc/grpc-js";
import { wallets } from "fabric-wallet-migration";
import { connect, hash, signers } from "@hyperledger/fabric-gateway";

async function connectGateway(client: grpc.Client): Promise<Gateway> {
    const wallet = await wallets.newFileSystemWallet("path/to/wallet");
    const entry = await wallet.get("myIdLabel");
    if (!entry) {
        throw new Error("Failed to read wallet entry");
    }

    const identity = entry.identity;
    const signer = signers.newPrivateKeySigner(entry.privateKey);

    return connect({
        identity,
        signer,
        hash: hash.sha256,
        client,
    });
}
```
