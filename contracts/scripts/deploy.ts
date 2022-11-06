import { ethers } from "hardhat";

async function main() {
  const Club = await ethers.getContractFactory("Club");
  const club = await Club.deploy();
  await club.deployed();
  console.log(`club contract has been deployed successfully in ${club.address}`)
  const erc20 = await club.myERC20()
  console.log(`erc20 contract has been deployed successfully in ${erc20}`)
  const erc721 = await club.myERC721()
  console.log(`erc721 contract has been deployed successfully in ${erc721}`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
