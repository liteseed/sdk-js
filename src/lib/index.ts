import { interact } from "./interact.js";
import {
	ArweaveSigner,
	createData,
	type DataItem,
	type Signer,
	type Tag,
} from "./warp.js";

type CreateDataArgs = { data: string | Uint8Array };
type CreateDataResponse = Promise<DataItem>;

type InitiateArgs = { dataItem: DataItem; quantity: bigint };
type InitiateResponse = Promise<void>;

type GetUploadArgs = { id: string };
type GetUploadResponse = Promise<Upload>;

type Upload = {
	bundler: string;
	block: string;
	quantity: string;
	status: string;
};

type GetStakerArgs = { index: string };
type GetStakerResponse = Promise<Staker>;
type Staker = { id: string; url: string; reputation: string };

class Liteseed {
	private process: string;
	private signer: Signer;

	constructor(signer: Signer, process: string) {
		this.signer = signer;
		this.process = process;
	}

	async createDataItem({ data }: CreateDataArgs): CreateDataResponse {
		const dataItem = createData(data, this.signer);
		await dataItem.sign(this.signer);
		return dataItem;
	}

	async initiate({ dataItem, quantity }: InitiateArgs): InitiateResponse {
		const data = await dataItem.id;
		const tags: Tag[] = [
			{ name: "Action", value: "Initiate" },
			{ name: "Quantity", value: quantity.toString() },
		];
		const result = await interact(this.process, data, tags, this.signer);
		if (result.Error) {
			throw new Error(result.Error);
		}
	}

	async getStaker({ index }: GetStakerArgs): GetStakerResponse {
		const tags: Tag[] = [{ name: "Action", value: "Staker" }];
		const result = await interact(this.process, index, tags, this.signer);
		if (result.Error) {
			throw new Error(result.Error);
		}
		return JSON.parse(result.Messages[0].Data);
	}

	async getUpload({ id }: GetUploadArgs): GetUploadResponse {
		const data = id;
		const tags: Tag[] = [{ name: "Action", value: "Upload" }];
		const result = await interact(this.process, data, tags, this.signer);
		if (result.Error) {
			throw new Error(result.Error);
		}
		return JSON.parse(result.Messages[0].Data);
	}
}

export { ArweaveSigner, Liteseed, type DataItem, type Tag, type Signer };
