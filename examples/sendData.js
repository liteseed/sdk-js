import { readFileSync } from "node:fs";
import { Liteseed } from "@liteseed/sdk";

const jwk = JSON.parse(readFileSync("./arweave.json").toString());
const liteseed = new Liteseed(jwk);
const data = readFileSync("image.jpeg");

async function upload(data) {
  const dataItem = await liteseed.signData({ data });
  const receipt = await liteseed.postSignedData({ dataItem });
  console.log(receipt);
  const payment = await liteseed.sendPayment({ dataItem });
  console.log(payment);
}

upload(data);

