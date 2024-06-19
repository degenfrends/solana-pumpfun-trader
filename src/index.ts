import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionInstruction, clusterApiUrl } from '@solana/web3.js';
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddress } from '@solana/spl-token';
import { createTransaction } from './utils/create-transaction';
import { sendTransaction } from './utils/send-transaction';
import { bufferFromUInt64, getKeyPairFromPrivateKey } from './utils/helper';
import getCoinData from './utils/get-token-data';

export const GLOBAL = new PublicKey('4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf');
export const FEE_RECIPIENT = new PublicKey('CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM');
export const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
export const ASSOC_TOKEN_ACC_PROG = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
export const RENT = new PublicKey('SysvarRent111111111111111111111111111111111');
export const PUMP_FUN_PROGRAM = new PublicKey('6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P');
export const PUMP_FUN_ACCOUNT = new PublicKey('Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1');
export const SYSTEM_PROGRAM_ID = SystemProgram.programId;

export default class PumpFunTrader {
    private connection: Connection;
    private logger: any;

    constructor(solanaRpcUrl: string = 'https://api.mainnet-beta.solana.com', logger: any = console) {
        this.connection = new Connection(solanaRpcUrl, 'confirmed');
        this.logger = logger;
    }

    setSolanaRpcUrl(solanaRpcUrl: string) {
        this.connection = new Connection(solanaRpcUrl, 'confirmed');

        return this;
    }

    setLogger(logger: any) {
        this.logger = logger;

        return this;
    }
    async pumpFunBuy(
        payerPrivateKey: string,
        mintStr: string,
        solIn: number,
        priorityFeeInSol: number = 0,
        slippageDecimal: number = 0.25,
        isSimulation: boolean = true
    ) {
        try {
            const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');

            const coinData = await getCoinData(mintStr);
            if (!coinData) {
                console.error('Failed to retrieve coin data...');
                return;
            }

            const payer = await getKeyPairFromPrivateKey(payerPrivateKey);
            const owner = payer.publicKey;
            const mint = new PublicKey(mintStr);

            const txBuilder = new Transaction();

            const tokenAccountAddress = await getAssociatedTokenAddress(mint, owner, false);

            const tokenAccountInfo = await connection.getAccountInfo(tokenAccountAddress);

            let tokenAccount: PublicKey;
            if (!tokenAccountInfo) {
                txBuilder.add(createAssociatedTokenAccountInstruction(payer.publicKey, tokenAccountAddress, payer.publicKey, mint));
                tokenAccount = tokenAccountAddress;
            } else {
                tokenAccount = tokenAccountAddress;
            }

            const solInLamports = solIn * LAMPORTS_PER_SOL;
            const tokenOut = Math.floor((solInLamports * coinData['virtual_token_reserves']) / coinData['virtual_sol_reserves']);

            const solInWithSlippage = solIn * (1 + slippageDecimal);
            const maxSolCost = Math.floor(solInWithSlippage * LAMPORTS_PER_SOL);
            const ASSOCIATED_USER = tokenAccount;
            const USER = owner;
            const BONDING_CURVE = new PublicKey(coinData['bonding_curve']);
            const ASSOCIATED_BONDING_CURVE = new PublicKey(coinData['associated_bonding_curve']);

            const keys = [
                { pubkey: GLOBAL, isSigner: false, isWritable: false },
                { pubkey: FEE_RECIPIENT, isSigner: false, isWritable: true },
                { pubkey: mint, isSigner: false, isWritable: false },
                { pubkey: BONDING_CURVE, isSigner: false, isWritable: true },
                { pubkey: ASSOCIATED_BONDING_CURVE, isSigner: false, isWritable: true },
                { pubkey: ASSOCIATED_USER, isSigner: false, isWritable: true },
                { pubkey: USER, isSigner: false, isWritable: true },
                { pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false },
                { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                { pubkey: RENT, isSigner: false, isWritable: false },
                { pubkey: PUMP_FUN_ACCOUNT, isSigner: false, isWritable: false },
                { pubkey: PUMP_FUN_PROGRAM, isSigner: false, isWritable: false }
            ];

            const data = Buffer.concat([bufferFromUInt64('16927863322537952870'), bufferFromUInt64(tokenOut), bufferFromUInt64(maxSolCost)]);

            const instruction = new TransactionInstruction({
                keys: keys,
                programId: PUMP_FUN_PROGRAM,
                data: data
            });
            txBuilder.add(instruction);

            const transaction = await createTransaction(connection, txBuilder.instructions, payer.publicKey, priorityFeeInSol);
            if (!isSimulation) {
                const signature = await sendTransaction(connection, transaction, [payer]);
                console.log('Buy transaction confirmed:', signature);
            } else if (isSimulation) {
                const simulatedResult = await connection.simulateTransaction(transaction);
                console.log(simulatedResult);
            }
        } catch (error) {
            console.log(error);
        }
    }
    async pumpFunSell(
        payerPrivateKey: string,
        mintStr: string,
        tokenBalance: number,
        priorityFeeInSol: number = 0,
        slippageDecimal: number = 0.25,
        isSimulation: boolean = true
    ) {
        try {
            const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');

            const coinData = await getCoinData(mintStr);
            if (!coinData) {
                console.error('Failed to retrieve coin data...');
                return;
            }

            const payer = await getKeyPairFromPrivateKey(payerPrivateKey);
            const owner = payer.publicKey;
            const mint = new PublicKey(mintStr);
            const txBuilder = new Transaction();

            const tokenAccountAddress = await getAssociatedTokenAddress(mint, owner, false);

            const tokenAccountInfo = await connection.getAccountInfo(tokenAccountAddress);

            let tokenAccount: PublicKey;
            if (!tokenAccountInfo) {
                txBuilder.add(createAssociatedTokenAccountInstruction(payer.publicKey, tokenAccountAddress, payer.publicKey, mint));
                tokenAccount = tokenAccountAddress;
            } else {
                tokenAccount = tokenAccountAddress;
            }

            const minSolOutput = Math.floor(
                (tokenBalance! * (1 - slippageDecimal) * coinData['virtual_sol_reserves']) / coinData['virtual_token_reserves']
            );

            const keys = [
                { pubkey: GLOBAL, isSigner: false, isWritable: false },
                { pubkey: FEE_RECIPIENT, isSigner: false, isWritable: true },
                { pubkey: mint, isSigner: false, isWritable: false },
                { pubkey: new PublicKey(coinData['bonding_curve']), isSigner: false, isWritable: true },
                { pubkey: new PublicKey(coinData['associated_bonding_curve']), isSigner: false, isWritable: true },
                { pubkey: tokenAccount, isSigner: false, isWritable: true },
                { pubkey: owner, isSigner: false, isWritable: true },
                { pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false },
                { pubkey: ASSOC_TOKEN_ACC_PROG, isSigner: false, isWritable: false },
                { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                { pubkey: PUMP_FUN_ACCOUNT, isSigner: false, isWritable: false },
                { pubkey: PUMP_FUN_PROGRAM, isSigner: false, isWritable: false }
            ];

            const data = Buffer.concat([bufferFromUInt64('12502976635542562355'), bufferFromUInt64(tokenBalance), bufferFromUInt64(minSolOutput)]);

            const instruction = new TransactionInstruction({
                keys: keys,
                programId: PUMP_FUN_PROGRAM,
                data: data
            });
            txBuilder.add(instruction);

            const transaction = await createTransaction(connection, txBuilder.instructions, payer.publicKey, priorityFeeInSol);

            if (!isSimulation) {
                const signature = await sendTransaction(connection, transaction, [payer]);
                console.log('Sell transaction confirmed:', signature);
            } else if (isSimulation) {
                const simulatedResult = await connection.simulateTransaction(transaction);
                console.log(simulatedResult);
            }
        } catch (error) {
            console.log(error);
        }
    }
    async buy(
        privateKey: string,
        tokenAddress: string,
        amount: number,
        priorityFee: number = 0,
        slippage: number = 0.25,
        isSimulation: boolean = true
    ) {
        try {
            const txBuilder = new Transaction();
            const instruction = await this.getBuyInstruction(privateKey, tokenAddress, amount, slippage, txBuilder);
            if (!instruction?.instruction) {
                this.logger.error('Failed to retrieve buy instruction...');
                return;
            }
            txBuilder.add(instruction.instruction);
            const signature = await this.createAndSendTransaction(txBuilder, privateKey, priorityFee, isSimulation);
            this.logger.log('Sell transaction confirmed:', signature);

            return signature;
        } catch (error) {
            this.logger.log(error);
        }
    }

    async sell(
        privateKey: string,
        tokenAddress: string,
        tokenBalance: number,
        priorityFee: number = 0,
        slippage: number = 0.25,
        isSimulation: boolean = true
    ) {
        try {
            const instruction = await this.getSellInstruction(privateKey, tokenAddress, tokenBalance, slippage);
            const txBuilder = new Transaction();
            if (!instruction) {
                this.logger.error('Failed to retrieve sell instruction...');
                return;
            }

            txBuilder.add(instruction);

            const signature = await this.createAndSendTransaction(txBuilder, privateKey, priorityFee, isSimulation);
            this.logger.log('Sell transaction confirmed:', signature);
        } catch (error) {
            this.logger.log(error);
        }
    }
    async createAndSendTransaction(txBuilder: Transaction, privateKey: string, priorityFee: number = 0, isSimulation: boolean = true) {
        const walletPrivateKey = await getKeyPairFromPrivateKey(privateKey);

        const transaction = await createTransaction(this.connection, txBuilder.instructions, walletPrivateKey.publicKey, priorityFee);
        if (isSimulation == false) {
            const signature = await sendTransaction(this.connection, transaction, [walletPrivateKey]);
            this.logger.log('Buy transaction confirmed:', signature);
            return signature;
        } else if (isSimulation == true) {
            const simulatedResult = await this.connection.simulateTransaction(transaction);
            this.logger.log(simulatedResult);
        }
    }
    async getBuyInstruction(privateKey: string, tokenAddress: string, amount: number, slippage: number = 0.25, txBuilder: Transaction) {
        const coinData = await getCoinData(tokenAddress);
        if (!coinData) {
            this.logger.error('Failed to retrieve coin data...');
            return;
        }

        const walletPrivateKey = await getKeyPairFromPrivateKey(privateKey);
        const owner = walletPrivateKey.publicKey;
        const token = new PublicKey(tokenAddress);

        const tokenAccountAddress = await getAssociatedTokenAddress(token, owner, false);

        const tokenAccountInfo = await this.connection.getAccountInfo(tokenAccountAddress);

        let tokenAccount: PublicKey;
        if (!tokenAccountInfo) {
            txBuilder.add(
                createAssociatedTokenAccountInstruction(walletPrivateKey.publicKey, tokenAccountAddress, walletPrivateKey.publicKey, token)
            );
            tokenAccount = tokenAccountAddress;
        } else {
            tokenAccount = tokenAccountAddress;
        }

        const solInLamports = amount * LAMPORTS_PER_SOL;
        const tokenOut = Math.floor((solInLamports * coinData['virtual_token_reserves']) / coinData['virtual_sol_reserves']);

        const amountWithSlippage = amount * (1 + slippage);
        const maxSolCost = Math.floor(amountWithSlippage * LAMPORTS_PER_SOL);
        const ASSOCIATED_USER = tokenAccount;
        const USER = owner;
        const BONDING_CURVE = new PublicKey(coinData['bonding_curve']);
        const ASSOCIATED_BONDING_CURVE = new PublicKey(coinData['associated_bonding_curve']);

        const keys = [
            { pubkey: GLOBAL, isSigner: false, isWritable: false },
            { pubkey: FEE_RECIPIENT, isSigner: false, isWritable: true },
            { pubkey: token, isSigner: false, isWritable: false },
            { pubkey: BONDING_CURVE, isSigner: false, isWritable: true },
            { pubkey: ASSOCIATED_BONDING_CURVE, isSigner: false, isWritable: true },
            { pubkey: ASSOCIATED_USER, isSigner: false, isWritable: true },
            { pubkey: USER, isSigner: false, isWritable: true },
            { pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: RENT, isSigner: false, isWritable: false },
            { pubkey: PUMP_FUN_ACCOUNT, isSigner: false, isWritable: false },
            { pubkey: PUMP_FUN_PROGRAM, isSigner: false, isWritable: false }
        ];
        const data = Buffer.concat([bufferFromUInt64('16927863322537952870'), bufferFromUInt64(tokenOut), bufferFromUInt64(maxSolCost)]);

        const instruction = new TransactionInstruction({
            keys: keys,
            programId: PUMP_FUN_PROGRAM,
            data: data
        });

        return { instruction: instruction, tokenAmount: tokenOut };
    }
    async getSellInstruction(privateKey: string, tokenAddress: string, tokenBalance: number, slippage: number = 0.25) {
        const coinData = await getCoinData(tokenAddress);
        if (!coinData) {
            this.logger.error('Failed to retrieve coin data...');
            return;
        }

        const payer = await getKeyPairFromPrivateKey(privateKey);
        const owner = payer.publicKey;
        const mint = new PublicKey(tokenAddress);
        const txBuilder = new Transaction();

        const tokenAccountAddress = await getAssociatedTokenAddress(mint, owner, false);

        const tokenAccountInfo = await this.connection.getAccountInfo(tokenAccountAddress);

        let tokenAccount: PublicKey;
        if (!tokenAccountInfo) {
            txBuilder.add(createAssociatedTokenAccountInstruction(payer.publicKey, tokenAccountAddress, payer.publicKey, mint));
            tokenAccount = tokenAccountAddress;
        } else {
            tokenAccount = tokenAccountAddress;
        }

        const minSolOutput = Math.floor((tokenBalance! * (1 - slippage) * coinData['virtual_sol_reserves']) / coinData['virtual_token_reserves']);

        const keys = [
            { pubkey: GLOBAL, isSigner: false, isWritable: false },
            { pubkey: FEE_RECIPIENT, isSigner: false, isWritable: true },
            { pubkey: mint, isSigner: false, isWritable: false },
            { pubkey: new PublicKey(coinData['bonding_curve']), isSigner: false, isWritable: true },
            { pubkey: new PublicKey(coinData['associated_bonding_curve']), isSigner: false, isWritable: true },
            { pubkey: tokenAccount, isSigner: false, isWritable: true },
            { pubkey: owner, isSigner: false, isWritable: true },
            { pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: ASSOC_TOKEN_ACC_PROG, isSigner: false, isWritable: false },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: PUMP_FUN_ACCOUNT, isSigner: false, isWritable: false },
            { pubkey: PUMP_FUN_PROGRAM, isSigner: false, isWritable: false }
        ];

        const data = Buffer.concat([bufferFromUInt64('12502976635542562355'), bufferFromUInt64(tokenBalance), bufferFromUInt64(minSolOutput)]);

        const instruction = new TransactionInstruction({
            keys: keys,
            programId: PUMP_FUN_PROGRAM,
            data: data
        });

        return instruction;
    }
}
