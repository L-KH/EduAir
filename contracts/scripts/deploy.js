const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying EduAirBadge to Hedera Testnet...\n");

  // Deploy with soulbound mode disabled (can transfer)
  // Set to true for soulbound tokens (non-transferable)
  const isSoulbound = false;

  const EduAirBadge = await hre.ethers.getContractFactory("EduAirBadge");
  const badge = await EduAirBadge.deploy(isSoulbound);

  await badge.waitForDeployment();

  const contractAddress = await badge.getAddress();

  console.log("✅ EduAirBadge deployed!");
  console.log(`📍 Contract Address: ${contractAddress}`);
  console.log(`🔗 Hashscan: https://hashscan.io/testnet/contract/${contractAddress}`);
  console.log(`🔒 Soulbound Mode: ${isSoulbound ? "Enabled (non-transferable)" : "Disabled (transferable)"}\n`);

  // Save deployment info
  const deployment = {
    contractAddress,
    network: "hedera-testnet",
    chainId: 296,
    isSoulbound,
    deployedAt: new Date().toISOString(),
    deployer: (await hre.ethers.getSigners())[0].address
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentPath = path.join(deploymentsDir, "testnet.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));

  console.log(`💾 Deployment info saved to: deployments/testnet.json\n`);
  console.log("📝 Next steps:");
  console.log("1. Copy the contract address");
  console.log("2. Use it in your frontend to mint badges");
  console.log("3. Example mint command:");
  console.log(`   const contract = new ethers.Contract("${contractAddress}", abi, signer);`);
  console.log(`   await contract.mint(recipientAddress, "ipfs://QmYourMetadata");\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
