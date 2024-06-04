import {
  ArweaveSigner,
  createData,
  DataItem,
  type Signer
} from "./warp.js";
import type { Receipt } from "./types.js";
import Arweave from 'arweave';


type PostDataItemArgs = {
  dataItem: DataItem;
}

type PostDataItemResponse = Promise<Receipt>

type SendPaymentInformationArgs = {
  transactionId: string;
  dataItemId: string;
}

type SendPaymentInformationResponse = Promise<Partial<Receipt>>

type PriceResponse = Promise<{ price: bigint, address: string }>

export type UploadArgs = Uint8Array

export type UploadResponse = Promise<Receipt>

export class Liteseed {
  private url: string = "http://localhost:8000"
  private arweave: Arweave;
  private privateKey: any;
  private signer: Signer;

  constructor(privateKey: any) {
    this.privateKey = privateKey;
    this.signer = new ArweaveSigner(privateKey);
    this.arweave = Arweave.init({
      host: "localhost",
      port: "8008",
      protocol: "http"
    });
  }


  async price(size: number): PriceResponse {
    let res = await fetch(`${this.url}/price/${size}`, {
      method: "GET",
    });
    if (res.status !== 200) {
      throw new Error(`Failed to fetch price data-item: ${await res.text()}`);
    }
    return await res.json();
  }

  async postDataItem({ dataItem }: PostDataItemArgs): PostDataItemResponse {
    let res = await fetch(`${this.url}/tx`, {
      method: "POST",
      body: dataItem.getRaw(),
      headers: {
        "content-length": dataItem.getRaw().length.toString(),
        "content-type": "application/octet-stream",
      }
    });
    if (res.status >= 400) {
      throw new Error(`Failed to post data-item: ${await res.text()}`);
    }
    return await res.json();
  }

  async sendPaymentInformation({ dataItemId, transactionId }: SendPaymentInformationArgs): SendPaymentInformationResponse {
    console.log(dataItemId, transactionId)
    let res = await fetch(`${this.url}/tx/${dataItemId}/${transactionId}`, { method: "PUT"});
    if (res.status >= 400) {
      throw new Error(`Failed to update data-item: ${await res.text()}`);
    }
    return await res.json();
  }

  async upload(data: UploadArgs): UploadResponse {
    const dataItem: DataItem = createData(data, this.signer);
    await dataItem.sign(this.signer);
    const size = dataItem.getRaw().length;
    const address = await this.arweave.wallets.jwkToAddress(this.privateKey);


    // Calculate price of upload
    const { price, address: target } = await this.price(size);
    const balance = await this.arweave.wallets.getBalance(address);
    if (price > BigInt(balance)) {
      throw new Error("Not enough AR to upload data");
    }
    // Send AR for upload 
    const transaction = await this.arweave.createTransaction({
      target: target,
      quantity: price.toString(),
    },
      this.privateKey
    );
    await this.arweave.transactions.sign(transaction, this.privateKey);
    await this.arweave.transactions.post(transaction);


    // Upload DataItem to bundler
    const receipt = await this.postDataItem({ dataItem });

    const updatedReceipt = await this.sendPaymentInformation({ dataItemId: await dataItem.id, transactionId: transaction.id })

   
    return { ...receipt, ...updatedReceipt };
  }
}

