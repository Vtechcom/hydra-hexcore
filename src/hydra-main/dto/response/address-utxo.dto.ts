type Nullable<T> = T | null;
type TxId = string;
type TxIndex = string;
export type ReferenceScript = Nullable<{
    scriptLanguage: string;
    script: {
        type: 'SimpleScript' | 'PlutusScriptV1' | 'PlutusScriptV2' | 'PlutusScriptV3';
        description: string;
        cborHex: string;
    };
}>;

export type TxHash = `${TxId}#${TxIndex}`;
export type UTxOObjectValue = {
    address: string;
    /**
     * `encoding: base16`
     */
    datum: Nullable<string>;
    datumhash: Nullable<string>;
    inlineDatum: Nullable<Record<string, any> | string>;
    /**
     * The base16-encoding of the CBOR encoding of some binary data
     */
    inlineDatumRaw?: Nullable<string>;
    /**
     * The base16-encoding of the CBOR encoding of some binary data
     */
    inlineDatumhash?: Nullable<string>;
    referenceScript: Nullable<ReferenceScript>;
    value: {
        lovelace: number | string;
    } & Record<string, any>;
};

export type UTxOObject = Record<TxHash, UTxOObjectValue>;
export class AddressUtxoDto implements UTxOObject {
    [k: TxHash]: UTxOObjectValue;
}
