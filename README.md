This module provides a custom WalletStore implementation that allows a Hyperledger Fabric version 1.4 wallet to be
used with the Hyperledger Fabric version 2.0 SDK for Node.

## Example migration from 1.4 to 2.0 wallet format

```javascript
import * as WalletMigration from "fabric-wallet-migration";
import { Wallet, Wallets } from "fabric-network";

async function migrateWallet(oldWalletDirectory: string, newWalletDirectory: string) {
    const walletStore = await WalletMigration.newFileSystemWalletStore(oldWalletDirectory);
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
