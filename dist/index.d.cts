
import { PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';

declare const GLOBAL: PublicKey;
declare const FEE_RECIPIENT: PublicKey;
declare const TOKEN_PROGRAM_ID: PublicKey;
declare const ASSOC_TOKEN_ACC_PROG: PublicKey;
declare const RENT: PublicKey;
declare const PUMP_FUN_PROGRAM: PublicKey;
declare const PUMP_FUN_ACCOUNT: PublicKey;
declare const SYSTEM_PROGRAM_ID: PublicKey;
declare class PumpFunTrader {
    private connection;
    private logger;
    constructor(solanaRpcUrl?: string, logger?: any);
    setSolanaRpcUrl(solanaRpcUrl: string): this;
    setLogger(logger: any): this;
    buy(privateKey: string, tokenAddress: string, amount: number, priorityFee?: number, slippage?: number, isSimulation?: boolean): Promise<void>;
    sell(privateKey: string, tokenAddress: string, tokenBalance: number, priorityFee?: number, slippage?: number, isSimulation?: boolean): Promise<void>;
    getBuyInstruction(privateKey: string, tokenAddress: string, amount: number, slippage: number | undefined, txBuilder: Transaction): Promise<TransactionInstruction | undefined>;

}

export { ASSOC_TOKEN_ACC_PROG, FEE_RECIPIENT, GLOBAL, PUMP_FUN_ACCOUNT, PUMP_FUN_PROGRAM, RENT, SYSTEM_PROGRAM_ID, TOKEN_PROGRAM_ID, PumpFunTrader as default };
