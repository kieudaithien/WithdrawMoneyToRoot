const Web3 = require('web3')
require('dotenv').config();
const tokenAAbi = require('./contractjson/BepA.json')
const tokenBAbi = require('./contractjson/BepB.json')
const privateKeyRoot = process.env.PRIVATE_KEY_ROOT
const eviroment = process.env.EVIROMENT_BSC_TESTNET;
var childPrivateKeys = JSON.parse(process.env.PRIVATE_KEY_CHILDS);
var isTransactionFist = true;
var tokens = [];

const waitFor = delay => new Promise(resolve => setTimeout(resolve, delay));

const withdrawAllTokenIntoRoot = async () => {
    //childPrivateKeys.push(process.env.PRIVATE_KEY_CHILDS)
    const web3 = new Web3(Web3.givenProvider || eviroment);
    if (web3) {
        tokens.push(await new web3.eth.Contract(tokenAAbi, "0xdB4a6e82A13AD06c88135F72f3291B2615E7929d"));
        tokens.push(await new web3.eth.Contract(tokenAAbi, "0x91055F354E3FcA54BBC01D2C9DBf0476C07ea1D7"))
        const addressRoot = await web3.eth.accounts.privateKeyToAccount(privateKeyRoot).address
        for (var i = 0; i < childPrivateKeys.length; i++) {
            const addressChild = web3.eth.accounts.privateKeyToAccount(childPrivateKeys[i]).address
            var nonce = await web3.eth.getTransactionCount(addressChild);
            var isTransactionFist = true;
            //Transfer tokens diference BNB
            for (var j = 0; j < tokens.length; j++) {
                const balanceToken = await tokens[j].methods.balanceOf(addressChild).call()
                console.log(i,j,nonce, isTransactionFist)
                if (balanceToken > 0) {
                    console.log(i,j)
                    if(isTransactionFist){
                        isTransactionFist = false
                        transferToken(nonce, addressChild, addressRoot, tokens[j], childPrivateKeys[i], web3)
                    }else {
                        nonce = await checkNone(web3, nonce, addressChild);
                        transferToken(nonce, addressChild, addressRoot, tokens[j], childPrivateKeys[i], web3)
                    }
                    console.log(i,j,nonce, isTransactionFist)
                } else {
                    console.log("token is not in this account")

                }
            }
            // transfer bnb token
            if(isTransactionFist){
                transferBNB(nonce, addressChild, addressRoot, childPrivateKeys[i], web3)
            }else{
                nonce = await checkNone(web3, nonce, addressChild)
                console.log("nonce", nonce)
                transferBNB(nonce, addressChild, addressRoot, childPrivateKeys[i], web3)
            }
        }
    } else {
        console.log("Web3 has some error, please check load web3")
    }
}
const transferToken = async (nonce, from, to, token, privateKey, web3) => {
    const balance = await token.methods.balanceOf(from).call()
    const gasPrice = await web3.eth.getGasPrice();
    to = token._address;
    const transfer = token.methods.transfer(to, balance)
    data = transfer.encodeABI()
    gas = await transfer.estimateGas({ from: from });
    if (await web3.eth.getBalance(from) - gas * gasPrice > 0) {
        signAndSendTransaction(0, from, to, gas, gasPrice, data, nonce, web3, privateKey)
    } else {
        console.log("Not enough money for gas at" + from);
    }
}

const transferBNB = async (nonce, from, to, privateKey, web3) => {
    const gasPrice = await web3.eth.getGasPrice();
    var gas = 21000;
    var data = undefined;
    const value = await web3.eth.getBalance(from) - gas * gasPrice
    if (value > 0) {
        signAndSendTransaction(value, from, to, gas, gasPrice, data, nonce, web3, privateKey)
    } else {
        console.log("Not enough money for gas" + from);
    }
}

const signAndSendTransaction = async (value, from, to, gas, gasPrice, data, nonce, web3, privateKey) => {
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
    var nonceCurrent = await web3.eth.getTransactionCount(address);
    while(nonceCurrent <= nonce){
        await waitFor(1000)
         nonceCurrent = await web3.eth.getTransactionCount(address);
    }
    return nonceCurrent;
}

withdrawAllTokenIntoRoot()