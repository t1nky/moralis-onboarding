import { JsonRpcProvider } from "ethers";
import { ethers } from "ethers";

const provider = new JsonRpcProvider("https://mainnet.optimism.io");

async function findBlockByTimestamp(targetTimestamp: number): Promise<number> {
  let maxBlock = await provider.getBlockNumber();
  let minBlock = 0;
  let block: ethers.Block | null;

  while (minBlock <= maxBlock) {
    let guessBlock = Math.floor((minBlock + maxBlock) / 2);
    block = await provider.getBlock(guessBlock);
    if (!block) {
      throw new Error("Block not found");
    }
    if (block.timestamp > targetTimestamp) {
      maxBlock = guessBlock - 1;
    } else if (block.timestamp < targetTimestamp) {
      minBlock = guessBlock + 1;
    } else {
      return guessBlock;
    }
  }

  return minBlock - 1;
}

(async () => {
  const startTimeStamp = Math.floor(
    new Date("2023-10-15T00:00:00Z").getTime() / 1000
  );
  const endTimeStamp = Math.floor(
    new Date("2023-10-25T23:59:00Z").getTime() / 1000
  );

  const startBlock = await findBlockByTimestamp(startTimeStamp);
  const endBlock = await findBlockByTimestamp(endTimeStamp);

  console.log(`Start Block: ${startBlock}`);
  console.log(`End Block: ${endBlock}`);
})();
