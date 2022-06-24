const Web3 = require('web3')
const tokenAAbi = require('./contractjson/BepA.json')
const tokenBAbi = require('./contractjson/BepB.json')
const privateKeyRoot = "e3635fdc340585e4bafbbb44c97bcf16039abeefa01abcd8e5408b091032678b"
var isTransactionFist = true;
const { BigNumber } = require('ethers');

const childPrivateKeys = [
    "666c27f28ef8a3dcc9ae27badfc6f537c50287f1a21066bae613b23a76b2049f",
    "a2ba5cd8d9687607e5b0306d7ca85c2dec956cfe2739e243630c5f6a94e9b63e"
]
var tokens = [];

const withdrawAllTokenIntoRoot = async () => {
    const web3 = new Web3(Web3.givenProvider || 'https://data-seed-prebsc-1-s1.binance.org:8545');
    web3.eth.accounts.wallet.add(privateKeyRoot)
    if (web3) {
        tokens.push(await new web3.eth.Contract(tokenAAbi, "0xdB4a6e82A13AD06c88135F72f3291B2615E7929d"));
        tokens.push(await new web3.eth.Contract(tokenAAbi, "0x91055F354E3FcA54BBC01D2C9DBf0476C07ea1D7"))
        const addressRoot = await web3.eth.accounts.privateKeyToAccount(privateKeyRoot).address

        for (var i = 0; i < childPrivateKeys.length; i++) {
            web3.eth.accounts.wallet.add(childPrivateKeys[i])
            const addressChild = web3.eth.accounts.privateKeyToAccount(childPrivateKeys[i]).address
            var balance = await web3.eth.getBalance(addressChild)
            console.log("transfer tokens diference BNB")
            var nonce = await web3.eth.getTransactionCount(addressChild);
            var isTransactionFist = true;
            console.log("nonce", nonce)

            for (var j = 0; j < tokens.length; j++) {
                const balanceToken = await tokens[j].methods.balanceOf(addressChild).call()
                console.log(i,j,nonce, isTransactionFist)
                if (balanceToken > 0) {
                    console.log(i,j)
                    if(isTransactionFist){
                        isTransactionFist = false
                        transferToken(nonce, addressChild, addressRoot,
                        tokens[j], balanceToken, childPrivateKeys[i], web3, false)
                    }else {
                        nonce = await checkNone(web3, nonce, addressChild);
                        transferToken(nonce, addressChild, addressRoot,
                            tokens[j], balanceToken, childPrivateKeys[i], web3, false)
                    }
                    console.log(i,j,nonce, isTransactionFist)
                    balance = await web3.eth.getBalance(addressChild)
                } else {
                    console.log("token is not in this account")

                }
            }
            console.log("transfer bnb token")

            if (balance > 0) {
                if(isTransactionFist){
                    transferToken(nonce, addressChild, addressRoot, undefined, 0, childPrivateKeys[i], web3, true)
                }else{
                    nonce = await checkNone(web3, nonce, addressChild)
                    console.log("nonce", nonce)
                    transferToken(nonce, addressChild, addressRoot, undefined, 0, childPrivateKeys[i], web3, true)

                }
            }
        }
    } else {
        console.log("Web3 has some error, please check load web3")
    }
}
const transferToken = async (nonce, from, to, token, balance, privateKey, web3, isBNB) => {
    const gasPrice = await web3.eth.getGasPrice();
    var gas = 21000;
    var data = undefined;
    if (isBNB) {
        const value = await web3.eth.getBalance(from) - gas * gasPrice
        if (value > 0) {
            //console.log(value, from, to, gas, gasPrice, nonce, web3, privateKey, isBNB)
            signTransaction(value, from, to, gas, gasPrice, data, nonce, web3, privateKey)

        } else {
            console.log("Not enough money for gas" + from);
        }
    } else {
        to = token._address;
        const transfer = token.methods.transfer(to, balance)
        data = transfer.encodeABI()
        gas = await transfer.estimateGas({ from: from });
        if (await web3.eth.getBalance(from) - gas * gasPrice > 0) {
            signTransaction(0, from, to, gas, gasPrice, data, nonce, web3, privateKey)
        } else {
            console.log("Not enough money for gas at" + from);
        }
    }

}
const signTransaction = async (value, from, to, gas, gasPrice, data, nonce, web3, privateKey) => {
    const signedTx = await web3.eth.accounts.signTransaction(
        {
            value: value,
            from: from,
            to: to,
            gas: gas,
            gasPrice: gasPrice,
            data: data,
            nonce: nonce,
        },
        privateKey
    )
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    console.log(`Transaction hash: ${receipt.transactionHash}`);

}


async function checkNone(web3, nonce, address){
    console.log("check nonce")
    for (var i = 0; i < 10000000000; i++) {
        const nonceCurrent = await web3.eth.getTransactionCount(address);
        console.log("nonceCurrent", nonceCurrent)
        if (nonceCurrent <= nonce) {
            setTimeout(function(){}, 10000); 
        } else {
            return nonceCurrent;
        }
    }
    return nonce;
}

withdrawAllTokenIntoRoot()