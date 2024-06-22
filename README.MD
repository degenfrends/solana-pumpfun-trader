# Solana Pump.fun Trader

![Static Badge](https://img.shields.io/badge/degen-100%25-pink)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/degenfrends/solana-pumpfun-trader/publish.yml)
![NPM License](https://img.shields.io/npm/l/%40degenfrends%2Fsolana-pumpfun-trader)
![NPM Version](https://img.shields.io/npm/v/@degenfrends/solana-pumpfun-trader)
![NPM Downloads](https://img.shields.io/npm/dw/@degenfrends/solana-pumpfun-trader)
![GitHub Repo stars](https://img.shields.io/github/stars/degenfrends/solana-pumpfun-trader)
![X (formerly Twitter) URL](https://img.shields.io/twitter/url?url=https%3A%2F%2Fx.com%2Fkryptobrah&label=Twitter%2FX)

## This project is more or less a copy of https://github.com/bilix-software/solana-pump-fun. I made a npm package out of it and resturctured/refactored the code a little bit.

[Join the discord if you are looking for fellow degen developers!](https://discord.gg/HUVAbet2Dp)

> [!CAUTION] 
> Do not use your main wallet with this script! Always use a trading wallet with your trading budget. Don't be lazy! Create a wallet for this now!

Solan Pump.fun Trader is a library to execute buy and sell orders for SPL tokens that were created on pump.fun.

## Installation

Just install it with npm or yarn or whatever.

```bash
npm install "@degenfrends/solana-pumpfun-trader"
```

## Configuration & Usage

```typescript
import PumpFunTrader from '@degenfrends/solana-pumpfun-trader';

const pumpFunTrader = new PumpFunTrader();
this.pumpFunTrader.setSolanaRpcUrl('https://yoursolanarpc.com');

await this.pumpFunTrader.buy(
        privateKey: '12123423434234', // your private key
        tokenAddress: 'ejddjsldjsdlks', // the address of the token you want to buy
        amount: 0.5, // amount in solana
        priorityFee: 0, // (optional) you should increase the priority fee when you want to make sure that transactions are always succesfull.
        slippage: 0.25, // (optional) 0.25 equals 25% slippage.
        isSimulation: false // (optional) 
);

await this.pumpFunTrader.sell(
    privateKey: '12123423434234', // your private key
    tokenAddress: 'ejddjsldjsdlks', // the address of the token you want to sell
    tokenBalance: 10000000 // the amounts of token you want to sell, you need to multiply the amount you want to sell by 1000000 since pump.fun tokens have 6 digits,
    priorityFee: 0, // (optional) you should increase the priority fee when you want to make sure that transactions are always succesfull.
    slippage: 0.25, // (optional) 0.25 equals 25% slippage.
    isSimulation: false // (optional) 
);
```

There are functions to build sell and buy transaction instructions too, which you can use to bundle transactions.

If you have any questions or suggestions, [join the discord!](https://discord.gg/HUVAbet2Dp)