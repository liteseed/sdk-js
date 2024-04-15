import {
	message as uploadMessage,
	result as readResult,
} from "@permaweb/aoconnect";
import { createData, type Signer, type Tag } from "./warp.js";

function createDataItemSigner(s: Signer) {
	const signer = async ({
		data,
		tags,
		target,
		anchor,
	}: { data?: string; tags?: {name?: string, value?: string}[]; target?: string; anchor?: string }) => {
		const dataItem = createData(data, s, { tags, target, anchor });
		return dataItem.sign(s).then(async () => ({
			id: await dataItem.id,
			raw: await dataItem.getRaw(),
		}));
	};
	return signer;
}

export async function interact(
	process: string,
	data: string,
	tags: Tag[],
	signer: Signer,
) {
	const message = await uploadMessage({
		process,
		data,
		tags,
		signer: createDataItemSigner(signer),
	});
  return readResult({
		process,
		message,
	});
}
