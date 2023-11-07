import { JsonRpcProvider, ethers } from "ethers";

const providers = {
  Optimism: new ethers.AlchemyProvider(
    "optimism",
    process.env.ALCHEMY_OPTIMISM_API_KEY
  ),
  Base: new JsonRpcProvider(
    `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_BASE_API_KEY}`
  ),
} satisfies Record<string, JsonRpcProvider>;

const contractABI = [
  "function uri(uint256 tokenId) public view returns (string memory)",
  "function balanceOf(address account, uint256 id) view returns (uint256)",
];

async function fetchAssetMetadata(
  provider: JsonRpcProvider,
  contractAddress: string,
  tokenId: string
) {
  const contract = new ethers.Contract(contractAddress, contractABI, provider);
  const tokenUri = await contract.uri(tokenId);
  const httpURL = tokenUri.replace("ipfs://", "https://ipfs.io/ipfs/");

  return (await fetch(httpURL)).json();
}

export async function getAssetsByAddress(address: string) {
  const checksumAddress = ethers.getAddress(address);
  const paddedAddress = ethers.toBeHex(checksumAddress, 32);

  const logPromises = Object.entries(providers).map(
    async ([provideName, provider]) => {
      const received = await provider.getLogs({
        fromBlock: "earliest",
        toBlock: "latest",
        topics: [
          ethers.id("TransferSingle(address,address,address,uint256,uint256)"),
          null,
          null,
          paddedAddress,
        ],
      });

      const assets = new Map<
        string,
        {
          amount: number;
          name: string;
          chain: string;
        }
      >();
      // not doing this in parallel to avoid rate limiting
      // if this is no a concern, this can be done in parallel
      // using map/reduce and Promise.all/allSettled
      for await (const log of received) {
        const [, tokenIdBig] = ethers.AbiCoder.defaultAbiCoder().decode(
          ["uint256", "uint256"],
          log.data
        );
        const tokenId = ethers.toBeHex(tokenIdBig);
        const tokenInContract = `${log.address}-${tokenId}`;
        if (assets.has(tokenInContract)) {
          continue;
        }
        const contract = new ethers.Contract(
          log.address,
          contractABI,
          provider
        );
        const balance = await contract.balanceOf(checksumAddress, tokenIdBig);
        if (balance > 0) {
          const metadata = await fetchAssetMetadata(
            provider,
            log.address,
            tokenId
          );

          assets.set(tokenInContract, {
            amount: ethers.toNumber(balance),
            name: metadata.name,
            chain: provideName,
          });
        }
      }

      return assets;
    }
  );

  const logs = await Promise.all(logPromises);
  const result = [];
  for (const log of logs) {
    // or in case of large data sets, iterate over log elements and push to avoid memory issues
    result.push(...log.values());
  }

  return result;
}
