import { useState, useEffect } from 'react';
import { useAuctionContract } from './useAuctionContract';

export const useMultipleBidders = () => {
    const bidders = [
        {
            name: 'Alice',
            pk: import.meta.env.VITE_ALICE_PK,
            aesKey: import.meta.env.VITE_ALICE_AES_KEY,
            address: import.meta.env.VITE_ALICE_ADDRESS
        },
        {
            name: 'Bob',
            pk: import.meta.env.VITE_BOB_PK,
            aesKey: import.meta.env.VITE_BOB_AES_KEY,
            address: import.meta.env.VITE_BOB_ADDRESS
        },
        {
            name: 'Bea',
            pk: import.meta.env.VITE_BEA_PK,
            aesKey: import.meta.env.VITE_BEA_AES_KEY,
            address: import.meta.env.VITE_BEA_ADDRESS
        },
        {
            name: 'Charlie',
            pk: import.meta.env.VITE_CHARLIE_PK,
            aesKey: import.meta.env.VITE_CHARLIE_AES_KEY,
            address: import.meta.env.VITE_CHARLIE_ADDRESS
        },
        {
            name: 'David',
            pk: import.meta.env.VITE_DAVID_PK,
            aesKey: import.meta.env.VITE_DAVID_AES_KEY,
            address: import.meta.env.VITE_DAVID_ADDRESS
        },
        {
            name: 'Ethan',
            pk: import.meta.env.VITE_ETHAN_PK,
            aesKey: import.meta.env.VITE_ETHAN_AES_KEY,
            address: import.meta.env.VITE_ETHAN_ADDRESS
        }
    ];

    // Filter out bidders without credentials
    const activeBidders = bidders.filter(bidder => bidder.pk && bidder.aesKey && bidder.address);

    return { bidders: activeBidders };
};
