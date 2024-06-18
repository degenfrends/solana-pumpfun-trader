var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.ts
import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction as Transaction2, TransactionInstruction } from "@solana/web3.js";
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddress } from "@solana/spl-token";

// src/utils/create-transaction.ts
import { Transaction, ComputeBudgetProgram } from "@solana/web3.js";
async function createTransaction(connection, instructions, wallet, priorityFee = 0) {
  const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
    units: 14e5
  });
  const transaction = new Transaction().add(modifyComputeUnits);
  if (priorityFee > 0) {
    const microLamports = priorityFee * 1e9;
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
__name(createTransaction, "createTransaction");

// src/utils/send-transaction.ts
import { sendAndConfirmTransaction } from "@solana/web3.js";
async function sendTransaction(connection, transaction, signers) {
  try {
    const signature = await sendAndConfirmTransaction(connection, transaction, signers, {
      skipPreflight: true,
      preflightCommitment: "confirmed"
    });
    console.log("Transaction confirmed with signature:", signature);
    return signature;
  } catch (error) {
    console.error("Error sending transaction:", error);
    return null;
  }
}
__name(sendTransaction, "sendTransaction");

// src/utils/helper.ts
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
async function getKeyPairFromPrivateKey(key) {
  return Keypair.fromSecretKey(new Uint8Array(bs58.decode(key)));
}
__name(getKeyPairFromPrivateKey, "getKeyPairFromPrivateKey");
function bufferFromUInt64(value) {
  let buffer = Buffer.alloc(8);
  buffer.writeBigUInt64LE(BigInt(value));
  return buffer;
}
__name(bufferFromUInt64, "bufferFromUInt64");

// src/utils/get-token-data.ts
import axios from "axios";
async function getCoinData(mintStr) {
  try {
    const url = `https://frontend-api.pump.fun/coins/${mintStr}`;
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        Referer: "https://www.pump.fun/",
        Origin: "https://www.pump.fun",
        Connection: "keep-alive",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "cross-site",
        "If-None-Match": 'W/"43a-tWaCcS4XujSi30IFlxDCJYxkMKg"'
      }
    });
    if (response.status === 200) {
      return response.data;
    } else {
      console.error("Failed to retrieve coin data:", response.status);
      return null;
    }
  } catch (error) {
    console.error("Error fetching coin data:", error);
    return null;
  }
}
__name(getCoinData, "getCoinData");

// src/index.ts
var GLOBAL = new PublicKey("4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf");
var FEE_RECIPIENT = new PublicKey("CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM");
var TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
var ASSOC_TOKEN_ACC_PROG = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
var RENT = new PublicKey("SysvarRent111111111111111111111111111111111");
var PUMP_FUN_PROGRAM = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");
var PUMP_FUN_ACCOUNT = new PublicKey("Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1");
var SYSTEM_PROGRAM_ID = SystemProgram.programId;
var PumpFunTrader = class {
  static {
    __name(this, "PumpFunTrader");
  }
  connection;
  logger;
  constructor(solanaRpcUrl = "https://api.mainnet-beta.solana.com", logger = console) {
    this.connection = new Connection(solanaRpcUrl, "confirmed");
    this.logger = logger;
  }
  setSolanaRpcUrl(solanaRpcUrl) {
    this.connection = new Connection(solanaRpcUrl, "confirmed");
    return this;
  }
  setLogger(logger) {
    this.logger = logger;
    return this;
  }
  async buy(privateKey, tokenAddress, amount, priorityFee = 0, slippage = 0.25, isSimulation = true) {
    try {
      const txBuilder = new Transaction2();
      const instruction = await this.getBuyInstruction(privateKey, tokenAddress, amount, slippage, txBuilder);
      if (!instruction) {
        this.logger.error("Failed to retrieve buy instruction...");
        return;
      }
      txBuilder.add(instruction);
      const walletPrivateKey = await getKeyPairFromPrivateKey(privateKey);
      const transaction = await createTransaction(this.connection, txBuilder.instructions, walletPrivateKey.publicKey, priorityFee);
      if (isSimulation == false) {
        const signature = await sendTransaction(this.connection, transaction, [
          walletPrivateKey
        ]);
        this.logger.log("Buy transaction confirmed:", signature);
      } else if (isSimulation == true) {
        const simulatedResult = await this.connection.simulateTransaction(transaction);
        this.logger.log(simulatedResult);
      }
    } catch (error) {
      this.logger.log(error);
    }
  }
  async sell(privateKey, tokenAddress, tokenBalance, priorityFee = 0, slippage = 0.25, isSimulation = true) {
    try {
      const coinData = await getCoinData(tokenAddress);
      if (!coinData) {
        this.logger.error("Failed to retrieve coin data...");
        return;
      }
      const payer = await getKeyPairFromPrivateKey(privateKey);
      const owner = payer.publicKey;
      const mint = new PublicKey(tokenAddress);
      const txBuilder = new Transaction2();
      const tokenAccountAddress = await getAssociatedTokenAddress(mint, owner, false);
      const tokenAccountInfo = await this.connection.getAccountInfo(tokenAccountAddress);
      let tokenAccount;
      if (!tokenAccountInfo) {
        txBuilder.add(createAssociatedTokenAccountInstruction(payer.publicKey, tokenAccountAddress, payer.publicKey, mint));
        tokenAccount = tokenAccountAddress;
      } else {
        tokenAccount = tokenAccountAddress;
      }
      const minSolOutput = Math.floor(tokenBalance * (1 - slippage) * coinData["virtual_sol_reserves"] / coinData["virtual_token_reserves"]);
      const keys = [
        {
          pubkey: GLOBAL,
          isSigner: false,
          isWritable: false
        },
        {
          pubkey: FEE_RECIPIENT,
          isSigner: false,
          isWritable: true
        },
        {
          pubkey: mint,
          isSigner: false,
          isWritable: false
        },
        {
          pubkey: new PublicKey(coinData["bonding_curve"]),
          isSigner: false,
          isWritable: true
        },
        {
          pubkey: new PublicKey(coinData["associated_bonding_curve"]),
          isSigner: false,
          isWritable: true
        },
        {
          pubkey: tokenAccount,
          isSigner: false,
          isWritable: true
        },
        {
          pubkey: owner,
          isSigner: false,
          isWritable: true
        },
        {
          pubkey: SYSTEM_PROGRAM_ID,
          isSigner: false,
          isWritable: false
        },
        {
          pubkey: ASSOC_TOKEN_ACC_PROG,
          isSigner: false,
          isWritable: false
        },
        {
          pubkey: TOKEN_PROGRAM_ID,
          isSigner: false,
          isWritable: false
        },
        {
          pubkey: PUMP_FUN_ACCOUNT,
          isSigner: false,
          isWritable: false
        },
        {
          pubkey: PUMP_FUN_PROGRAM,
          isSigner: false,
          isWritable: false
        }
      ];
      const data = Buffer.concat([
        bufferFromUInt64("12502976635542562355"),
        bufferFromUInt64(tokenBalance),
        bufferFromUInt64(minSolOutput)
      ]);
      const instruction = new TransactionInstruction({
        keys,
        programId: PUMP_FUN_PROGRAM,
        data
      });
      txBuilder.add(instruction);
      const transaction = await createTransaction(this.connection, txBuilder.instructions, payer.publicKey, priorityFee);
      if (isSimulation == false) {
        const signature = await sendTransaction(this.connection, transaction, [
          payer
        ]);
        this.logger.log("Sell transaction confirmed:", signature);
      } else if (isSimulation == true) {
        const simulatedResult = await this.connection.simulateTransaction(transaction);
        this.logger.log(simulatedResult);
      }
    } catch (error) {
      this.logger.log(error);
    }
  }
  async getBuyInstruction(privateKey, tokenAddress, amount, slippage = 0.25, txBuilder) {
    const coinData = await getCoinData(tokenAddress);
    if (!coinData) {
      this.logger.error("Failed to retrieve coin data...");
      return;
    }
    const walletPrivateKey = await getKeyPairFromPrivateKey(privateKey);
    const owner = walletPrivateKey.publicKey;
    const token = new PublicKey(tokenAddress);
    const tokenAccountAddress = await getAssociatedTokenAddress(token, owner, false);
    const tokenAccountInfo = await this.connection.getAccountInfo(tokenAccountAddress);
    let tokenAccount;
    if (!tokenAccountInfo) {
      txBuilder.add(createAssociatedTokenAccountInstruction(walletPrivateKey.publicKey, tokenAccountAddress, walletPrivateKey.publicKey, token));
      tokenAccount = tokenAccountAddress;
    } else {
      tokenAccount = tokenAccountAddress;
    }
    const solInLamports = amount * LAMPORTS_PER_SOL;
    const tokenOut = Math.floor(solInLamports * coinData["virtual_token_reserves"] / coinData["virtual_sol_reserves"]);
    const amountWithSlippage = amount * (1 + slippage);
    const maxSolCost = Math.floor(amountWithSlippage * LAMPORTS_PER_SOL);
    const ASSOCIATED_USER = tokenAccount;
    const USER = owner;
    const BONDING_CURVE = new PublicKey(coinData["bonding_curve"]);
    const ASSOCIATED_BONDING_CURVE = new PublicKey(coinData["associated_bonding_curve"]);
    const keys = [
      {
        pubkey: GLOBAL,
        isSigner: false,
        isWritable: false
      },
      {
        pubkey: FEE_RECIPIENT,
        isSigner: false,
        isWritable: true
      },
      {
        pubkey: token,
        isSigner: false,
        isWritable: false
      },
      {
        pubkey: BONDING_CURVE,
        isSigner: false,
        isWritable: true
      },
      {
        pubkey: ASSOCIATED_BONDING_CURVE,
        isSigner: false,
        isWritable: true
      },
      {
        pubkey: ASSOCIATED_USER,
        isSigner: false,
        isWritable: true
      },
      {
        pubkey: USER,
        isSigner: false,
        isWritable: true
      },
      {
        pubkey: SYSTEM_PROGRAM_ID,
        isSigner: false,
        isWritable: false
      },
      {
        pubkey: TOKEN_PROGRAM_ID,
        isSigner: false,
        isWritable: false
      },
      {
        pubkey: RENT,
        isSigner: false,
        isWritable: false
      },
      {
        pubkey: PUMP_FUN_ACCOUNT,
        isSigner: false,
        isWritable: false
      },
      {
        pubkey: PUMP_FUN_PROGRAM,
        isSigner: false,
        isWritable: false
      }
    ];
    const data = Buffer.concat([
      bufferFromUInt64("16927863322537952870"),
      bufferFromUInt64(tokenOut),
      bufferFromUInt64(maxSolCost)
    ]);
    const instruction = new TransactionInstruction({
      keys,
      programId: PUMP_FUN_PROGRAM,
      data
    });
    return instruction;
  }
};
export {
  ASSOC_TOKEN_ACC_PROG,
  FEE_RECIPIENT,
  GLOBAL,
  PUMP_FUN_ACCOUNT,
  PUMP_FUN_PROGRAM,
  RENT,
  SYSTEM_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  PumpFunTrader as default
};
