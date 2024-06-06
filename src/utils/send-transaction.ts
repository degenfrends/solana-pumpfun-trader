import { Connection, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';

export async function sendTransaction(connection: Connection, transaction: Transaction, signers: any[]) {
    try {
        const signature = await sendAndConfirmTransaction(connection, transaction, signers, {
            skipPreflight: true,
            preflightCommitment: 'confirmed'
        });
        console.log('Transaction confirmed with signature:', signature);
        return signature;
    } catch (error) {
        console.error('Error sending transaction:', error);
        return null;
    }
}
