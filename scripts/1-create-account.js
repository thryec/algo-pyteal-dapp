import algosdk from "algosdk";

const myAccount = algosdk.generateAccount();
console.log("Account Address = " + myAccount.addr);

let accountMnemonic = algosdk.secretKeyToMnemonic(myAccount.sk);
console.log("Account Mnemonic = " + accountMnemonic);
