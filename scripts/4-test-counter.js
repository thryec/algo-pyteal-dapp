import dotenv from 'dotenv'
import algosdk from 'algosdk'
dotenv.config()

async function readGlobalState(client, index) {
  let applicationInfoResponse = await client.getApplicationByID(index).do()
  let globalState = []
  globalState = applicationInfoResponse['params']['global-state']
  for (let n = 0; n < globalState.length; n++) {
    console.log(applicationInfoResponse['params']['global-state'][n])
  }
}

let myaccount = algosdk.mnemonicToSecretKey(process.env.ACCOUNT_MNEMONIC)
let sender = myaccount.addr

const baseServer = 'https://testnet-algorand.api.purestake.io/ps2'
const port = ''
const token = {
  'X-API-Key': process.env.API_KEY,
}

const algodClient = new algosdk.Algodv2(token, baseServer, port)

let index = 91704579

let appArgs1 = []
let appArgs2 = []
let add = 'Add'
let deduct = 'Deduct'

appArgs1.push(new Uint8Array(Buffer.from(add)))
appArgs2.push(new Uint8Array(Buffer.from(deduct)))
;(async () => {
  try {
    console.log('Intial Global State')
    await readGlobalState(algodClient, index)
    let params = await algodClient.getTransactionParams().do()

    // addition
    let txn = algosdk.makeApplicationNoOpTxn(sender, params, index, appArgs1)
    let txId = txn.txID().toString()

    // sign, send, and wait
    let signedTxn = txn.signTxn(myaccount.sk)
    console.log('Signed transaction with txID: %s', txId)
    await algodClient.sendRawTransaction(signedTxn).do()
    await algosdk.waitForConfirmation(algodClient, txId, 2)

    // display results
    let transactionResponse = await algodClient
      .pendingTransactionInformation(txId)
      .do()
    console.log('Called app-id:', transactionResponse['txn']['txn']['apid'])
    if (transactionResponse['global-state-delta'] !== undefined) {
      console.log(
        'Global State updated:',
        transactionResponse['global-state-delta']
      )
    }
  } catch (err) {
    console.error('Tests failed!', err)
    process.exit(1)
  }
})()
