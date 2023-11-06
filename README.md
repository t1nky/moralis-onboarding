# moralis-onboarding

## Description

This is a REST API that provides information about NFTs. It is built using Node.js, TypeScript, the Hono web framework, and ethers.js.

## Endpoints

### GET /nfts/:address

Returns an array of NFTs associated with the provided address. Each NFT object in the array has the following structure:

```json
{
  "amount": number,
  "name": string
}
```

## Installation

```bash
npm install
```

## Usage

```bash
npm run start
```
