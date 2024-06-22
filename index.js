const PumpFunTrader = require('./dist/index.js').default;
require('dotenv').config();

async function test() {
    try {
        const pumpFunTrader = new PumpFunTrader();
        //pumpFunTrader.setSolanaRpcUrl('https://smart-dimensional-wish.solana-mainnet.quiknode.pro/05451aac2fe8d3efcab2bfdf3e3ef5f75090c9ee/');
        const buySignature = await pumpFunTrader.buy(process.env.PRIVATE_KEY, 'ANxaB4vsAKwVV6XaLfBTddZ4JQxboaGsjRnC8tdwnsYf', 0.01, 0, 0.25, false);
        console.log('buySignature', buySignature);

        const sellSignature = await pumpFunTrader.sell(
            process.env.PRIVATE_KEY,
            'ANxaB4vsAKwVV6XaLfBTddZ4JQxboaGsjRnC8tdwnsYf',
            //pump.fun tokens have 6 decimals, so you need to multiply by 1,000,000
            178176 * 1000000,
            0,
            0.25,
            false
        );
        console.log('sellSignature', sellSignature);
    } catch (error) {
        console.error('error', error);
    }
}

test();
