
import sig from "@tendermint/sig";
import { base64PubkeyToAddress } from "secretjs";

import { query } from './db.js';
import { getOffset, emptyOrRows } from '../utils/helper.js';

import { SecretNetworkClient, Wallet } from "secretjs";
import axios from 'axios';

const wallet = new Wallet(
  process.env.MNEMONIC,
);
const operatorAddress = wallet.address
console.log("Operator Address: ", operatorAddress)
const secretjs = await SecretNetworkClient.create({
  grpcWebUrl: process.env.GRPC_URL,
  wallet: wallet,
  walletAddress: operatorAddress,
  chainId: process.env.CHAIN_ID,
});

const authorized = ["secret14fa9jm9g5mjs35yxarh057lesy4zszw5gavcun","secret1s7hqr22y5unhsc9r4ddnj049ltn9sa9pt55nzz",'secret1kw60atrdvqsjqcwlheuuy9ch6wyljnydtz0jcd' ]

export async function mintToken (input) {
  const signature = JSON.parse(input.signature)
  //verify address is authorized
  const address = base64PubkeyToAddress(signature.pub_key.value, "secret")
  if (!authorized.includes(address)) throw `${address} is not authorized to perform this function.`

  //verify recipient is present
  const recipient = input.recipient
  if (!recipient) throw "Request does not include a recipient address.";

  //verify teddy ID is present and valid
  const teddyId = parseInt(input.nft_id)
  if (!input.nft_id | !teddyId || teddyId > 3030 || teddyId < 1) throw "Request does not include a Teddy ID or provided ID is invalid.";

  const notes = input.notes || null

  // unsigned permit to verify
  const permitTx = {
    chain_id: process.env.CHAIN_ID,
    account_number: "0", // Must be 0
    sequence: "0", // Must be 0
    fee: {
      amount: [{ denom: "uscrt", amount: "0" }], // Must be 0 uscrt
      gas: "1", // Must be 1
    },
    msgs: [
      {
        type: "mint_ticket", // Must be "query_permit"
        value: {
          permit_name: input.permit_name,
          allowed_destinations: JSON.parse(input.allowed_destinations),
          mint_props: {
            teddy_id: teddyId.toString(),
            recipient: recipient.trim()
          }
        },
      },
    ],
    memo: "" // Must be empty
  }

  //verify signature
  if (!sig.verifySignature(permitTx, signature)) throw "Provided permit was unable to be verified.";

  //verify teddy ID has not already been issued a token
  if (await inDb(teddyId)) throw `Golden ticket has already been issued for teddy ID ${teddyId}.`

  const tokenSn = await getNextSnFromChain();

  //# mint ticket to destination
  const mintMsg = {
    mint_nft: {
        owner: recipient,
        token_id: tokenSn.toString(),
        //quantity: 1,
        //mint_run_id: "1",
        public_metadata: {
          extension: {
            name: "MTC Golden Ticket",
            image: "https://2js4ov65zeljocwwkl6a3xaezxudwlrqaq2tzkltht4rlv5sti.arweave.net/0mXHV93_JFpcK1lL8DdwEzeg7LjAENTypczz5Fdeymo"
          }
        },
        serial_number: {
          mint_run: 1,
          serial_number: tokenSn
        },
    }
  } 

  const tx = await secretjs.tx.compute.executeContract(
    {
      sender: operatorAddress,
      contract: process.env.TICKET_CONTRACT_ADDRESS,
      codeHash: process.env.TICKET_CONTRACT_HASH,
      msg: mintMsg
    },
    {
      gasLimit: 100_000,
      gasPriceInFeeDenom: process.env.GAS_PRICE,
      feeDenom: "uscrt",
    },
  );

  console.log(tx.transactionHash)
  if (tx.code) throw `Transaction Error: ${tx.rawLog}`
  
  let tokenId;
  try {
    tokenId = Number(
      tx.arrayLog.find((log) => log.type === "wasm" && log.key === "minted")
        .value,
    );
  } catch (err) {
    throw `Internal Error:\nThe token appears to have been minted!\nPlease send the following information to Xiphiar: Failed to get token ID for ${tx.transactionHash}\nTeddy ID: ${teddyId}\nToken SN: ${tokenSn}\nRecipient: ${recipient}\nIssuer: ${address}\nNotes: ~${notes}~\nError: ${err}`
  }

  //#mark teddy in DB
  try{
    await setDb(tokenId, tokenSn, teddyId, recipient, address, notes);
  } catch (err) {
    throw `Internal Error:\nThe token appears to have been minted!\nPlease send the following information to Xiphiar:\nFailed to add to database for ${tx.transactionHash}\nTeddy ID: ${teddyId}\nToken ID: ${tokenId}\nToken SN: ${tokenSn}\nRecipient: ${recipient}\nIssuer: ${address}\nNotes: ~${notes}~\nError: ${err}`
  }

  //update stashh
  // DOESNT WORK, will need to do this manually
  /*
  try{
    const response = await axios.get('https://stashhapp-public-testnet.azurewebsites.net/nft/update', {
      params: {
        params: JSON.stringify({
          contractAddress: process.env.TICKET_CONTRACT_ADDRESS,
          ids: [tokenId]
        })
      }
    })
  } catch(err) {
    throw `Internal Error:\nFailed to add token to Stashh.\nPlease send the following information to Xiphiar:\n${tx.transactionHash}\nTeddy ID: ${teddyId}\nToken ID: ${tokenId}\nToken SN: ${tokenSn}\nRecipient: ${recipient}\nIssuer: ${address}\nNotes: ~${notes}~\nError: ${err}`
  }
  */

  return {message: "OK"}
}

async function setDb(tokenId, tokenSn, teddyId, recipient, issuer, notes){
  const sql = `INSERT INTO gold_tokens (token_id, token_sn, teddy_id, recipient, issuer, notes) VALUES (?, ?, ?, ?, ?, ?);`
  const rows = await query(
    sql,
    [tokenId, tokenSn, teddyId, recipient, issuer, notes],
  );
  const data = emptyOrRows(rows);

}

async function inDb(teddyId){
  const sql = "SELECT * FROM `gold_tokens` WHERE `teddy_id` = ?;"
  const rows = await query(
    sql,
    [teddyId],
  );
  const data = emptyOrRows(rows);
  return(Boolean(data.length))
}

async function getNextSn(){
  const sql = "SELECT MAX(token_sn) as max FROM `gold_tokens` WHERE 1=1;"
  const rows = await query(
    sql,
  );
  const data = emptyOrRows(rows);
  return data[0].max+1
}

async function getNextSnFromChain(){
  const all_tokens_query = {
    all_tokens: {
      limit: 3030
    }
  };

  const {token_list} = await secretjs.query.compute.queryContract({
    address: process.env.TICKET_CONTRACT_ADDRESS,
    codeHash: process.env.TICKET_CONTRACT_HASH, // optional but way faster
    query: all_tokens_query,
  });

  if (!token_list.tokens.length) return 1

  let highest = token_list.tokens[token_list.tokens.length-1]

  const info_query = {
    nft_dossier: {
      token_id: highest
    }
  }

  const {nft_dossier} = await secretjs.query.compute.queryContract({
    address: process.env.TICKET_CONTRACT_ADDRESS,
    codeHash: process.env.TICKET_CONTRACT_HASH, // optional but way faster
    query: info_query,
  });

  return parseInt(nft_dossier.mint_run_info.serial_number)+1
}

export default {
  mintToken
}
