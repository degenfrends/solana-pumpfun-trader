import { Connection, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';

export async function sendTransaction(connection: Connection, transaction: Transaction, signers: any[], logger: any = console) {
    try {
        const signature = await sendAndConfirmTransaction(connection, transaction, signers, {
            skipPreflight: true,
            preflightCommitment: 'confirmed'
        });
        return signature;
    } catch (error) {
        logger.error('Error sending transaction:', error);
        return null;
    }
}
