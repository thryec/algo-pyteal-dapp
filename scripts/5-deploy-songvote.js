import dotenv from 'dotenv'
import algosdk from 'algosdk'
import { open, readFile } from 'node:fs/promises'
dotenv.config()

const baseServer = 'https://testnet-algorand.api.purestake.io/ps2'
const port = ''
const token = {
  'X-API-Key': process.env.API_KEY,
}

const algodClient = new algosdk.Algodv2(token, baseServer, port)

let myAccount = algosdk.mnemonicToSecretKey(process.env.ACCOUNT_MNEMONIC)
let sender = myAccount.addr

const compileProgram = async (client, TealSource) => {
  let encoder = new TextEncoder()
  let programBytes = encoder.encode(TealSource)
  let compileResponse = await algodClient.compile(programBytes).do()
  let compiledBytes = new Uint8Array(
    Buffer.from(compileResponse.result, 'base64')
  )
  return compiledBytes
}

;(async () => {
  try {
    const localInts = 0
    const localBytes = 0
    const globalInts = 2
    const globalBytes = 0

    let approvalProgramFile = await open(
      './contracts/artifacts/songvote_approval.teal'
    )
    let clearProgramFile = await open(
      './contracts/artifacts/songvote_clear.teal'
    )

    const approvalProgram = await approvalProgramFile.readFile()
    const clearProgram = await clearProgramFile.readFile()
    const approvalProgramBinary = await compileProgram(
      algodClient,
      approvalProgram
    )

    const clearProgramBinary = await compileProgram(algodClient, clearProgram)

    let params = await algodClient.getTransactionParams().do()
    const onComplete = algosdk.OnApplicationComplete.NoOpOC
    console.log('deploying application...')

    let txn = algosdk.makeApplicationCreateTxn(
      sender,
      params,
      onComplete,
      approvalProgramBinary,
      clearProgramBinary,
      localInts,
      localBytes,
      globalInts,
      globalBytes
    )

    let txId = txn.txID().toString()

    // sign transaction
    let signedTxn = txn.signTxn(myAccount.sk)
    console.log('Signed transaction with txID: %s', txId)

    // send transaction
    await algodClient.sendRawTransaction(signedTxn).do()

    // wait for confirmation
    await algosdk.waitForConfirmation(algodClient, txId, 2)

    // print app id
    let transactionResponse = await algodClient
      .pendingTransactionInformation(txId)
      .do()
    let appId = transactionResponse['application-index']
    console.log('Created new with app-id: ', appId)
  } catch (err) {
    console.error('Failed to deploy!', err)
    process.exit(1)
  }
})()
