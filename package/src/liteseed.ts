import { ArweaveSigner, createData, DataItem, type JWKInterface } from "arbundles";
import type { ArweaveConfig, Receipt } from "./types.js";
import Arweave from 'arweave';

export type SignDataArgs = { data: Uint8Array | string; };
export type SignDataResponse = Promise<DataItem>;
export type PostDataItemArgs = { dataItem: DataItem; };
export type PostDataItemResponse = Promise<Receipt>;
export type PriceResponse = Promise<{ price: bigint; address: string; }>;

export type PayArgs = { dataItem: DataItem; };
export type PayResponse = Promise<{ id: string; paymentId: string; }>;
export type NotifyArgs = { id: string; paymentId: string };
export type NotifyResponse = Promise<{ id: string; paymentId: string; }>;

export type SendPaymentArgs = { dataItem: DataItem; };
export type SendPaymentResponse = Promise<{ id: string; paymentId: string; }>;

export class Liteseed {
    private url: string = "https://api.liteseed.xyz"
    private arweave: Arweave;
    private readonly jwk: JWKInterface | any;

    constructor(jwk: JWKInterface | any, apiConfig?: ArweaveConfig) {
        this.jwk = jwk;
        this.arweave = Arweave.init({...apiConfig});
    }

    // Take data of
    async signData({data}: SignDataArgs): SignDataResponse {
        const signer = new ArweaveSigner(this.jwk);
        const dataItem = createData(data, signer);
        await dataItem.sign(signer);
        return dataItem;
    }

    async getCurrentPrice(size: number): PriceResponse {
        let res = await fetch(`${this.url}/price/${size}`, {
            method: "GET",
        });
        if (res.status !== 200) {
            throw new Error(`Failed to fetch price data-item: ${await res.text()}`);
        }
        return await res.json();
    }

    async postSignedData({dataItem}: PostDataItemArgs): PostDataItemResponse {
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

    async pay({dataItem}: PayArgs): PayResponse {
        const size = dataItem.getRaw().length;
        const address = await this.arweave.wallets.jwkToAddress(this.jwk);

        const {price, address: target} = await this.getCurrentPrice(size);
        const balance = await this.arweave.wallets.getBalance(address);
        if (price > BigInt(balance)) {
            throw new Error("Not enough AR to upload data");
        }
        const tx = await this.arweave.createTransaction({quantity: price.toString(), target}, this.jwk);
        await this.arweave.transactions.sign(tx, this.jwk);
        await this.arweave.transactions.post(tx);
        return {id: dataItem.id, paymentId: tx.id};
    }

    async notify({id, paymentId}: NotifyArgs): NotifyResponse {
        let res = await fetch(`${this.url}/tx/${id}/${paymentId}`, {method: "PUT"});
        if (res.status >= 400) {
            throw new Error(`Failed to update data-item: ${await res.text()}`);
        }
        return await res.json();
    }

    async sendPayment({dataItem}: SendPaymentArgs): SendPaymentResponse {
        const payment = await this.pay({dataItem});
        return await this.notify(payment);
    }
}

