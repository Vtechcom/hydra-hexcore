export function resolvePartyDirPath(partyId: number | string, prefix = '') {
    return `${removeTrailingSlash(prefix)}/party-${partyId}`
}

export function resolveHeadDirPath(headId: number | string, prefix = '') {
    return `${removeTrailingSlash(prefix)}/head-${headId}`
}

/**
 * @deprecated
 */
export function resolveNodeDirPath(nodeName: string, partyId?: number  | string) {
    const dirPath = `${nodeName}`
    if (partyId) {
        return `${resolvePartyDirPath(partyId)}/${dirPath}`
    }
    return dirPath
}

/**
 * 
 * @param headId example: `1`
 * @param nodeName Name of hydra node, example: `'hydra-node-1'`
 * @param prefix Prefix path dir, example: `/home/ubuntu/hydra-persistences`
 * @returns `/home/ubuntu/hydra-persistences/head-1/persistence-hydra-node-1`
 */
export function resolvePersistenceDir(headId: number | string, nodeName: string, prefix = '') {
    return `${resolveHeadDirPath(headId, prefix)}/persistence-${nodeName}`
}

function removeTrailingSlash(str: string): string {
    return str.replace(/\/+$/, '');
}
