[![COTI Website](https://img.shields.io/badge/COTI%20WEBSITE-4CAF50?style=for-the-badge)](https://coti.io)
[![image](https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://telegram.coti.io)
[![image](https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.coti.io)
[![image](https://img.shields.io/badge/X-000000?style=for-the-badge&logo=x&logoColor=white)](https://twitter.coti.io)
[![image](https://img.shields.io/badge/YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://youtube.coti.io)

# COTI Privacy-Preserving Demo Applications

A collection of demonstration applications showcasing COTI's Multi-Party Computation (MPC) technology for privacy-preserving blockchain applications. Each demo illustrates different use cases of encrypted computation, from secure voting to private auctions.

## 🎯 Overview

These applications demonstrate how COTI's MPC technology enables confidential smart contracts where sensitive data remains encrypted throughout its entire lifecycle - during storage, computation, and transmission. Only authorized parties can decrypt specific results, ensuring complete privacy while maintaining blockchain transparency and verifiability.

## 📱 Demo Applications


### 🎯 Age Guessing Game
**Live Demo:** [https://age.demo.coti.io](https://age.demo.coti.io)  
**Source Code:** [/age](./age)

A decentralized game demonstrating privacy-preserving age verification. Players guess an admin's age through encrypted comparisons without ever seeing the actual value.

**Key Features:**
- Encrypted age storage on-chain
- Private comparison operations
- Interactive guessing interface
- Admin controls for game management

---

### 🏆 Private Auction
**Live Demo:** [https://auction.demo.coti.io](https://auction.demo.coti.io)  
**Source Code:** [/auction](./auction)

A sealed-bid auction system where bids remain completely confidential until the auction ends. Ensures fair price discovery without revealing sensitive bidding information to competitors.

**Key Features:**
- Encrypted bid submission and storage
- Private bid comparisons using MPC
- Automatic winner determination
- Fair settlement with token integration

---

### 💰 Millionaires' Problem
**Live Demo:** [https://millionaire.demo.coti.io](https://millionaire.demo.coti.io)  
**Source Code:** [/milionaire](./milionaire)

Implementation of Yao's classic Millionaires' Problem using COTI's Garbled Circuits. Two parties can determine who is wealthier without revealing their actual wealth values to each other.

**Key Features:**
- Secure multi-party comparison
- Encrypted wealth submission
- Privacy-preserving result computation
- Zero-knowledge proof of comparison

---


### 🗳️ Encrypted Voting
**Live Demo:** [https://vote.demo.coti.io](https://vote.demo.coti.io)  
**Source Code:** [/vote](./vote)

A privacy-preserving voting system where individual votes remain encrypted on-chain. Only aggregated results are revealed after the election closes, ensuring voter privacy while maintaining result accuracy.

**Key Features:**
- Encrypted vote storage using MPC
- Private vote tallying without revealing individual choices
- Voter authorization and access control
- Real-time election state management

