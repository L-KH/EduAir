const hre = require("hardhat");

async function main() {
  // Get command line arguments
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log("Usage: node scripts/mintBadge.js <contractAddress> <recipientAddress> <tokenURI>");
    console.log("\nExample:");
    console.log("  node scripts/mintBadge.js 0x1234...5678 0xabcd...ef01 ipfs://QmExample");
    process.exit(1);
  }

  const [contractAddress, recipientAddress, tokenURI] = args;

  console.log("🎨 Minting EduAir Badge...\n");
  console.log(`📍 Contract:  ${contractAddress}`);
  console.log(`👤 Recipient: ${recipientAddress}`);
  console.log(`📄 Token URI: ${tokenURI}\n`);

  // Get contract instance
  const EduAirBadge = await hre.ethers.getContractFactory("EduAirBadge");
  const badge = EduAirBadge.attach(contractAddress);

  // Get signer
  const [signer] = await hre.ethers.getSigners();
  console.log(`🔑 Minting from: ${signer.address}\n`);

  // Mint the badge
  console.log("⏳ Submitting transaction...");
  const tx = await badge.mint(recipientAddress, tokenURI);
  
  console.log(`📤 Transaction hash: ${tx.hash}`);
  console.log("⏳ Waiting for confirmation...");
  
  const receipt = await tx.wait();
  
  console.log("✅ Badge minted successfully!\n");
  console.log(`🔗 Block number: ${receipt.blockNumber}`);
  console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);
  
  // Get token ID from event
  const mintEvent = receipt.logs.find(log => {
    try {
      const parsed = badge.interface.parseLog(log);
      return parsed.name === 'BadgeMinted';
    } catch {
      return false;
    }
  });

  if (mintEvent) {
    const parsed = badge.interface.parseLog(mintEvent);
    console.log(`🎫 Token ID: ${parsed.args.tokenId.toString()}`);
  }

  // Get total supply
  const totalSupply = await badge.totalSupply();
  console.log(`📊 Total badges minted: ${totalSupply.toString()}\n`);

  console.log("🔍 View on Hashscan:");
  console.log(`   https://hashscan.io/testnet/transaction/${tx.hash}`);
  console.log(`   https://hashscan.io/testnet/contract/${contractAddress}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error minting badge:", error);
    process.exit(1);
  });
