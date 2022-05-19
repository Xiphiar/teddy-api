
import sig from "@tendermint/sig";
import { base64PubkeyToAddress } from "secretjs";

import { query } from './db.js';
import { getOffset, emptyOrRows } from '../utils/helper.js';
import { getRarity } from "./rarity.js";

const blacklisted = ["secret1s7hqr22y5unhsc9r4ddnj049ltn9sa9ptDUMMY"]
const factoryAuthorized = ['secret14fa9jm9g5mjs35yxarh057lesy4zszw5gavcun','secret1s7hqr22y5unhsc9r4ddnj049ltn9sa9pt55nzz']

export async function factoryOrder (input) {
  const owner = input.owner.trim() || null
  if (!owner) throw "Something went wrong: Request did not include an owner address."

  const signature = JSON.parse(input.signature)

  //verify address is not blacklisted
  const address = base64PubkeyToAddress(signature.pub_key.value, "secret")
  if (blacklisted.includes(address)) throw `${address} is blacklisted from this API.`



  const teddy1 = input.teddy1 || null
  const teddy2 = input.teddy2 || null
  const teddy3 = input.teddy3 || null

  const tx_hash = input.tx_hash || null
  
  const base = input.base || null
  const face = input.face || null
  const color = input.color || null
  const background = input.background || null
  const hand = input.hand || null
  const head = input.head || null
  const body = input.body || null
  const eyewear = input.eyewear || null

  const notes = input.notes || null
  const name = input.name || null

  if (!tx_hash) throw "Something went wrong: Request did not include an TX Hash."
  if (!teddy1) throw "Something went wrong: Request did not include an ID for Teddy #1."
  if (!teddy2) throw "Something went wrong: Request did not include an ID for Teddy #2."
  if (!teddy3) throw "Something went wrong: Request did not include an ID for Teddy #3."
  if (!base) throw "Something went wrong: Request did not include a base design."

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
        type: "factory_order", // Must match the type on the client
        value: {
          permit_name: input.permit_name,
          allowed_destinations: JSON.parse(input.allowed_destinations),
          order_details: {
            teddy1: teddy1,
            teddy2: teddy2,
            teddy3: teddy3,
            owner: owner,
            tx_hash: tx_hash,
            base_design: base,
            face: face,
            color: color,
            background: background,
            hand: hand,
            head: head,
            body: body,
            eyewear: eyewear,
            notes: notes,
            name: name
          }
        },
      },
    ],
    memo: "" // Must be empty
  }
  //console.log(JSON.stringify(permitTx, null, 2));
  //verify signature
  if (!sig.verifySignature(permitTx, signature)) throw "Provided permit was unable to be verified.";
  
  //verify tx hash is not already in DB
  if (await hashInDb(tx_hash)) throw `TX Hash ${tx_hash} is already in database!`

  const sql = `INSERT INTO factory_orders(
    owner, tx_hash, teddy1, teddy2, teddy3, name, final_base, final_face, final_color, final_background, final_hand, final_head, final_body, final_eyewear, notes)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  const rows = await query(
    sql,
    [owner, tx_hash, teddy1, teddy2, teddy3, name, base, face, color, background, hand, head, body, eyewear, notes],
  );
  const data = emptyOrRows(rows);

  return {message: "OK"}

}

export async function getOrders (input) {
  const signature = JSON.parse(input.signature)
  //verify address is authorized
  const address = base64PubkeyToAddress(signature.pub_key.value, "secret")
  if (!factoryAuthorized.includes(address)) throw `${address} is not authorized to perform this function.`

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
        type: "get_orders", // Must be "query_permit"
        value: {
          permit_name: input.permit_name,
          allowed_destinations: JSON.parse(input.allowed_destinations),
        },
      },
    ],
    memo: "" // Must be empty
  }

  //verify signature
  if (!sig.verifySignature(permitTx, signature)) throw "Provided permit was unable to be verified.";

  const sql = "SELECT * FROM `factory_orders` WHERE `completed` = ?;"
  const rows = await query(
    sql,
    [0],
  );
  const data = emptyOrRows(rows);
  //console.log(data);
  //return(Boolean(data.length))

  return {orders: data}
}


async function hashInDb(txHash){
  const sql = "SELECT * FROM `factory_orders` WHERE `tx_hash` = ?;"
  const rows = await query(
    sql,
    [txHash],
  );
  const data = emptyOrRows(rows);
  return(Boolean(data.length))
}

export default {
  factoryOrder,
  getOrders
}
