import { Connection, TransactionInstruction, PublicKey, Transaction, ComputeBudgetProgram } from '@solana/web3.js';

export async function createTransaction(
    connection: Connection,
    instructions: TransactionInstruction[],
    wallet: PublicKey,
    priorityFee: number = 0
): Promise<Transaction> {
    const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
        units: 1400000
    });

    const transaction = new Transaction().add(modifyComputeUnits);

    if (priorityFee > 0) {
        const microLamports = priorityFee * 1_000_000_000; // convert SOL to microLamports
        const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
            microLamports
        });
        transaction.add(addPriorityFee);
    }

    transaction.add(...instructions);

    transaction.feePayer = wallet;
    transaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
    return transaction;
}
