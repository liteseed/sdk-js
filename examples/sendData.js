import { readFileSync } from "node:fs";
import { Liteseed, ArweaveSigner } from "@liteseed/sdk";

const CONTRACT_ADDRESS = "qAbHIghbi7lb0Y8KdZr8q9dvH8xwXpawCXgGSD8OpJk";

const jwk = JSON.parse(readFileSync("./arweave.json").toString());
const signer = new ArweaveSigner(jwk);
const liteseed = new Liteseed(signer, CONTRACT_ADDRESS);

async function sendData(data) {
    const dataItem = await liteseed.createDataItem({ data });
    await liteseed.initiate({ dataItem, quantity: 100n });
    const id = await dataItem.id;
    console.log(id);
    const upload = await liteseed.getUpload({ id });
    console.log(upload);
    const staker = await liteseed.getStaker({ index: upload.bundler });
    const rawData = dataItem.getRaw();
    console.log(staker);
    const response = await fetch(staker.url, {
        method: "POST",
        body: rawData,
        headers: {
            "content-type": "application/octet-stream",
            "content-length": rawData.length.toString()
        }
    });
    console.log(response);
}
sendData("test");
