
import sig from "@tendermint/sig";
import { base64PubkeyToAddress } from "secretjs";

import { query } from './db.js';
import { getOffset, emptyOrRows } from '../utils/helper.js';
import { getRarity } from "./rarity.js";

const authorized = ["secret1s7hqr22y5unhsc9r4ddnj049ltn9sa9pt55nzz"]

export async function addTeddy (input) {
    const signature = JSON.parse(input.signature)
    //verify address is authorized
    const address = base64PubkeyToAddress(signature.pub_key.value, "secret")
    if (!authorized.includes(address)) throw `${address} is not authorized to perform this function.`

    //verify teddy ID is present and valid
    const teddyId = input.nft_id?.trim()
    //console.log(teddyId)
    if (!input.nft_id | !teddyId || parseInt(teddyId) < 1) throw "Request does not include a Teddy ID or provided ID is invalid.";

    //verify base design is present and valid
    if (!input.base_design || !input.base_design.trim()) throw "Request does not include a base design.";
    const baseDesign = input.base_design.trim();

    const face = input.face || null
    const color = input.color || null
    const background = input.background || null
    const hand = input.hand || null
    const head = input.head || null
    const body = input.body || null
    const eyewear = input.eyewear || null
    const pubUrl = input.pub_url || null
    const daoValue = input.dao_value || null
    const oneofone = parseInt(input["1of1"]) || 0
    const order = input.order ? JSON.parse(input.order) : undefined

    // unsigned permit to verify
    let permitTx;
    if (oneofone){
        permitTx = {
            chain_id: process.env.CHAIN_ID,
            account_number: "0", // Must be 0
            sequence: "0", // Must be 0
            fee: {
            amount: [{ denom: "uscrt", amount: "0" }], // Must be 0 uscrt
            gas: "1", // Must be 1
            },
            msgs: [
            {
                type: "add_teddy", // Must be "query_permit"
                value: {
                permit_name: input.permit_name,
                allowed_destinations: JSON.parse(input.allowed_destinations),
                mint_props: {
                    nft_id: teddyId.toString(),
                    base_design: baseDesign,
                    face: face,
                    color: color,
                    background: background,
                    hand: hand,
                    head: head,
                    body: body,
                    eyewear: eyewear,
                    pub_url: pubUrl,
                    dao_value: daoValue,
                    "1of1": oneofone
                }
                },
            },
            ],
            memo: "" // Must be empty
        }
    } else {
        if (!order) throw 'Request didnt include factory order information. non one-of-one mints must be factory orders.'
        console.log("Order", order);
        permitTx = {
            chain_id: process.env.CHAIN_ID,
            account_number: "0", // Must be 0
            sequence: "0", // Must be 0
            fee: {
            amount: [{ denom: "uscrt", amount: "0" }], // Must be 0 uscrt
            gas: "1", // Must be 1
            },
            msgs: [
            {
                type: "add_teddy", // Must be "query_permit"
                value: {
                permit_name: input.permit_name,
                allowed_destinations: JSON.parse(input.allowed_destinations),
                mint_props: {
                    nft_id: teddyId.toString(),
                    base_design: baseDesign,
                    face: face,
                    color: color,
                    background: background,
                    hand: hand,
                    head: head,
                    body: body,
                    eyewear: eyewear,
                    pub_url: pubUrl,
                    dao_value: daoValue,
                    "1of1": oneofone,
                    order: {
                        id: order.id,
                        teddies: [order.teddy1, order.teddy2, order.teddy3]
                    }
                }
                },
            },
            ],
            memo: "" // Must be empty
        }
    }
    console.log(JSON.stringify(permitTx, null, 2))

    //verify signature
    if (!sig.verifySignature(permitTx, signature)) throw "Provided permit was unable to be verified.";

    //verify teddy ID is not already in DB
    if (await inDb(teddyId)) throw `Teddy ID ${teddyId} is already in database!`

    let pubBaseDesign;
  
    switch(baseDesign){
        case 'Ro-Bear':
            pubBaseDesign = 'Ro-Bear';
            break;
        case 'Zom-Bear':
            pubBaseDesign = 'Zom-Bear';
            break;
        default:
            pubBaseDesign = 'Teddy-Bear';
            break;
    }

    const params = {
        id: teddyId,
        baseDesign: baseDesign,
        face: face,
        color: color,
        background: background,
        hand: hand,
        head: head,
        body: body,
        eyewear: eyewear,
        dao_value: daoValue,
        burnt: 0,
        pub_url: pubUrl,
        pub_base_design: pubBaseDesign,
        one_of_one: oneofone
    }

    try{
        await addTeddyToDB(params);
    } catch (err) {
        throw `Internal Error:\nPlease send the following information to Xiphiar:\nFailed to add teddy to database.\nData: ${JSON.stringify(params)}\nError: ${err}`
    }

    if (!oneofone){
        await completeOrder(order.id, [order.teddy1, order.teddy2, order.teddy3], teddyId);
    }

    updateRarity();

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

async function completeOrder(orderId, teddies, teddyId){
    try {
        const orderSql = `UPDATE factory_orders SET completed=1, minted_id=? WHERE id = ?`
        const rows = await query(
            orderSql,
            [teddyId, orderId],
        );
    } catch(e) {
        throw new Error(`Couldnt add teddy to DB. Unable to mark teddies ${JSON.stringify(teddies)} as burnt. ${e}`)
    }

    try {
        const burnSql1 = `UPDATE all_data SET burnt=1 WHERE id = ?`
        const rows1 = await query(burnSql1,[teddies[0]]);
    }  catch(e) {
        throw new Error(`Unable to mark teddies ${JSON.stringify(teddies)} as burnt. ${e}`)
    }

    try {
        const burnSql2 = `UPDATE all_data SET burnt=1 WHERE id = ?`
        const rows2 = await query(burnSql2,[teddies[1]]);
    }  catch(e) {
        throw new Error(`Unable to mark teddies ${teddies[1]},${teddies[2]} as burnt. ${e}`)
    }

    try {
        const burnSql3 = `UPDATE all_data SET burnt=1 WHERE id = ?`
        const rows3 = await query(burnSql3,[teddies[2]]);
    }  catch(e) {
        throw new Error(`Unable to mark teddy ${teddies[2]} as burnt. ${e}`)
    }
}

async function addTeddyToDB ({id, baseDesign, face = null, color = null, background = null, hand = null, head = null, body = null, eyewear = null, dao_value = null, burnt = 0, pub_url = null, pub_base_design = "Teddy-Bear", one_of_one = 0}) {
    const sql = `INSERT INTO all_data(id, base_design, face, color, background, hand, head, body, eyewear, dao_value, burnt, pub_url, pub_base_design, 1of1)
                  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    const rows = await query(
      sql,
      [id, baseDesign, face, color, background, hand, head, body, eyewear, dao_value, burnt, pub_url, pub_base_design, one_of_one],
      );
  const data = emptyOrRows(rows);
}

async function inDb(teddyId){
  const sql = "SELECT * FROM `all_data` WHERE `id` = ?;"
  const rows = await query(
    sql,
    [teddyId],
  );
  const data = emptyOrRows(rows);
  return(Boolean(data.length))
}

export async function updateRarity(){
    const sql = "SELECT * FROM `all_data` WHERE `burnt` = 0;"
    const rows = await query(
      sql
    );
    const data = emptyOrRows(rows);
    await data.forEach(async(element) => {
        
        let baseDesign = 0;
        if (element.base_design){
            const data = await getRarity(element.base_design);
            baseDesign = data.score
        }

        let face = 0;
        if (element.face){
            const data = await getRarity(element.face);
            face = data.score
        }

        let color = 0;
        if (element.color){
            const data = await getRarity(element.color);
            color = data.score
        }

        let background = 0;
        if (element.background){
            const data = await getRarity(element.background);
            background = data.score
        }

        let hand = 0;
        if (element.hand){
            const data = await getRarity(element.hand);
            hand = data.score
        }

        let head = 0;
        if (element.head){
            const data = await getRarity(element.head);
            head = data.score
        }

        let body = 0;
        if (element.body){
            const data = await getRarity(element.body);
            body = data.score
        }

        let eyewear = 0;
        if (element.eyewear){
            const data = await getRarity(element.eyewear);
            eyewear = data.score
        }

        const total = baseDesign + face + color + background + hand + head + body + eyewear;

        const sql2 = `UPDATE all_data SET total_rarity=? WHERE id = ?;`
        const rows2 = await query(
            sql2,
            [total, element.id],
        );
        const data2 = emptyOrRows(rows2);
        console.log(`Updated rarity for ${element.id}`)
    });
    console.log('done!')
}

export default {
    addTeddy,
    updateRarity
}
