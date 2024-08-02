import { readFileSync } from "node:fs";
import { Liteseed } from "@liteseed/sdk";

const jwk = JSON.parse(readFileSync("./arweave.json").toString());
const liteseed = new Liteseed(jwk);

async function upload(data) {
    const dataItem = await liteseed.signData({ data });

}
