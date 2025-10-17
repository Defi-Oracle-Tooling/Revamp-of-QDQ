const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy ERC20Token
  const ERC20Token = await ethers.getContractFactory("ERC20Token");
  const erc20 = await ERC20Token.deploy("TestToken", "TTK", 18, ethers.utils.parseEther("1000000"));
  await erc20.deployed();
  console.log("ERC20Token deployed to:", erc20.address);

  // Deploy ERC721NFT
  const ERC721NFT = await ethers.getContractFactory("ERC721NFT");
  const erc721 = await ERC721NFT.deploy("TestNFT", "TNFT");
  await erc721.deployed();
  console.log("ERC721NFT deployed to:", erc721.address);

  // Deploy MultiSig
  const MultiSig = await ethers.getContractFactory("MultiSig");
  const multiSig = await MultiSig.deploy([deployer.address], 1);
  await multiSig.deployed();
  console.log("MultiSig deployed to:", multiSig.address);

  // Deploy TimeLock
  const TimeLock = await ethers.getContractFactory("TimeLock");
  const timeLock = await TimeLock.deploy(2 * 24 * 60 * 60, [], []);
  await timeLock.deployed();
  console.log("TimeLock deployed to:", timeLock.address);

  // Deploy Governance
  const Governance = await ethers.getContractFactory("StandardGovernor");
  const governor = await Governance.deploy(
    erc20.address,
    timeLock.address,
    1,
    45818,
    0,
    4 // 4% quorum
  );
  await governor.deployed();
  console.log("Governor deployed to:", governor.address);

  // Deploy AccessControl
  const AccessControl = await ethers.getContractFactory("StandardAccessControl");
  const accessControl = await AccessControl.deploy(deployer.address);
  await accessControl.deployed();
  console.log("AccessControl deployed to:", accessControl.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
