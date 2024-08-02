import { ApiConfig as web } from "arweave/web/lib/api.js";
import { ApiConfig as node } from "arweave/node/lib/api.js";

export type Receipt = {
    id: string;
    dataCaches: string[];
    fastFinalityIndexes: string[];
    deadlineHeight: number;
    owner: string;
    version: string;
};

export type ArweaveConfig = web | node