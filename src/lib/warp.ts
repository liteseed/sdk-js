import * as WarpArBundles from "warp-arbundles";

// @ts-ignore
const pkg = WarpArBundles.default ? WarpArBundles.default : WarpArBundles;
const { createData, ArweaveSigner } = pkg;

type DataItem = WarpArBundles.DataItem;
type Signer = WarpArBundles.Signer;
type Tag = { name: string; value: string };


export { ArweaveSigner, createData, type DataItem, type Signer, type Tag };
