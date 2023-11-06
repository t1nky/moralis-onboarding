import { JsonRpcProvider, ethers } from "ethers";

// limit blocks as by requirements
const fromBlock = 110864611; // start of 15th of October 2023
const toBlock = 111339781; // end of 25th of October 2023

const provider = new JsonRpcProvider("https://mainnet.optimism.io");

async function fetchAssetMetadata(contractAddress: string, tokenId: string) {
  const contract = new ethers.Contract(
    contractAddress,
    ["function uri(uint256 tokenId) public view returns (string memory)"],
    provider
  );
  const tokenUri = await contract.uri(tokenId);
  const httpURL = tokenUri.replace("ipfs://", "https://ipfs.io/ipfs/");

  return (await fetch(httpURL)).json();
}

export async function getAssetsByAddress(address: string) {
  const checksumAddress = ethers.getAddress(address);
  const paddedAddress = ethers.toBeHex(checksumAddress, 32);

  const received = await provider.getLogs({
    fromBlock: fromBlock,
    toBlock: toBlock,
    topics: [
      ethers.id("TransferSingle(address,address,address,uint256,uint256)"),
      null,
      null,
      paddedAddress,
    ],
  });

  const result = [];
  for await (const log of received) {
    const [amountBig, tokenIdBig] = ethers.AbiCoder.defaultAbiCoder().decode(
      ["uint256", "uint256"],
      log.data
    );
    const metadata = await fetchAssetMetadata(
      log.address,
      ethers.toBeHex(tokenIdBig)
    );

    result.push({
      amount: ethers.toNumber(amountBig),
      name: metadata.name,
    });
  }

  return result;
}
