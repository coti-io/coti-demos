/**
 * Public deployed contract addresses.
 *
 * These are not secrets, so keep them in git instead of .env. Leave a value as
 * an empty string until that network is deployed.
 */
export const MILLIONAIRE_CONTRACT_ADDRESSES = {
    7082400: '0xE8d8CAAeB1256e0A29Fe266Cc8037e1861354177', // COTI Testnet
    11155111: '0x2a2947F594eCf8874F9E6ad6c10c584f79Eb0618', // Sepolia
    43113: '0xbFea405cFEC8BcDbDE923fe6bDD8cC3bfEAE6E38', // Avalanche Fuji
};

export function configuredAddress(address) {
    return typeof address === 'string' && address.trim() ? address.trim() : '';
}

export function getMillionaireContractAddress(chainId) {
    return configuredAddress(MILLIONAIRE_CONTRACT_ADDRESSES[String(chainId)]);
}
