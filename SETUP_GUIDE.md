# 🚀 EduAir Proof Node - Complete Setup Guide

This guide will walk you through setting up the entire EduAir system step-by-step.

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] Node.js 20+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] MetaMask browser extension installed
- [ ] Hedera Testnet account created at [portal.hedera.com](https://portal.hedera.com)
- [ ] Test HBAR in your account (use the faucet)

## 🔑 Step 1: Get Your Hedera Credentials

1. Go to [portal.hedera.com](https://portal.hedera.com)
2. Log in to your testnet account
3. Note your **Account ID** (format: 0.0.xxxxx)
4. Copy your **ED25519 Private Key** (for HCS - starts with 302e...)
5. Copy your **ECDSA Private Key** in Hex format (for smart contracts - starts with 0x)
6. Note your **EVM Address** (format: 0x...)

## 📦 Step 2: Install All Dependencies

Open a terminal in the project root:

```bash
cd C:\Users\LAHCENKHADDAOUI\Documents\Hackathon

# Install for each package
cd server && npm install && cd ..
cd web && npm install && cd ..
cd contracts && npm install && cd ..
cd simulator && npm install && cd ..
```

## 🌐 Step 3: Create HCS Topic

```bash
cd server

# Copy the example env file
copy .env.example .env

# Edit .env with your credentials:
# MY_ACCOUNT_ID=0.0.xxxxx
# MY_PRIVATE_KEY=302e020100300506032b6570...
# (Leave TOPIC_ID empty for now)
# PORT=8787

# Create the topic
npm run create:topic
```

**Important**: Copy the Topic ID that is printed (format: 0.0.yyyyy)

## ⚙️ Step 4: Configure All Packages

### Server (.env already configured above)
Just add the Topic ID you created:
```bash
TOPIC_ID=0.0.yyyyy
```

### Web
```bash
cd ..\web
copy .env.example .env
```

Edit `web/.env`:
```bash
VITE_TOPIC_ID=0.0.yyyyy
VITE_MIRROR_URL=https://testnet.mirrornode.hedera.com
VITE_HASHIO_RPC=https://testnet.hashio.io/api
VITE_DONATION_ADDRESS=0xYourEvmAddressFromHederaPortal
```

### Simulator
```bash
cd ..\simulator
copy .env.example .env
```

Edit `simulator/.env`:
```bash
API_URL=http://localhost:8787
DEVICE_ID=classroom-101
INTERVAL_SECONDS=5
```

### Contracts (optional - for NFT deployment)
```bash
cd ..\contracts
copy .env.example .env
```

Edit `contracts/.env`:
```bash
PRIVATE_KEY=0xYourECDSAHexKeyFromHederaPortal
HASHIO_RPC=https://testnet.hashio.io/api
CHAIN_ID=296
```

## 🏃 Step 5: Run the System (3 Terminals)

### Terminal 1 - Start the Server

```bash
cd C:\Users\LAHCENKHADDAOUI\Documents\Hackathon\server
npm run dev
```

You should see:
```
🚀 EduAir HCS API running on http://localhost:8787
📡 Publishing to Topic: 0.0.yyyyy
```

### Terminal 2 - Start the Web Dashboard

```bash
cd C:\Users\LAHCENKHADDAOUI\Documents\Hackathon\web
npm run dev
```

Your browser should open to http://localhost:5173

### Terminal 3 - Start the Simulator

```bash
cd C:\Users\LAHCENKHADDAOUI\Documents\Hackathon\simulator
npm run dev
```

You should see telemetry being sent every 5 seconds.

## 🎯 Step 6: Use the Dashboard

1. **View Live Data**: You should see messages appearing in the dashboard table
2. **Connect MetaMask**:
   - Click "Connect Wallet"
   - MetaMask will open
   - Approve the connection
   - You'll be prompted to add Hedera Testnet network (approve this)
3. **Send a Tip**:
   - Once connected, click "Tip This Class (0.001 HBAR)"
   - Approve the transaction in MetaMask
   - Wait for confirmation

## 🎨 Step 7: Deploy NFT Contract (Optional)

```bash
cd C:\Users\LAHCENKHADDAOUI\Documents\Hackathon\contracts
npm run deploy
```

**Copy the contract address** that is printed.

## 🏆 Step 8: Mint an NFT Badge (Browser Console)

1. Open the dashboard in your browser (http://localhost:5173)
2. Connect your wallet if not already connected
3. Open browser console (F12)
4. Paste this code (replace with your contract address):

```javascript
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

const contractAddress = "0xYourDeployedContractAddress";
const abi = [
  "function mint(address to, string tokenURI) public",
  "function totalSupply() public view returns (uint256)"
];

const contract = new ethers.Contract(contractAddress, abi, signer);

// Mint a badge
const myAddress = await signer.getAddress();
const tx = await contract.mint(
  myAddress, 
  "ipfs://QmExampleMetadataHash"
);

console.log("Transaction sent:", tx.hash);
const receipt = await tx.wait();
console.log("Badge minted! 🎉", receipt);

// Check total supply
const total = await contract.totalSupply();
console.log("Total badges minted:", total.toString());
```

## ✅ Verification Checklist

Confirm everything is working:

- [ ] Server is running and connected to Hedera Testnet
- [ ] Simulator is sending data every 5 seconds
- [ ] Dashboard shows live messages in the table
- [ ] Chart is displaying temperature/humidity trends
- [ ] MetaMask connected to Hedera Testnet (chainId 296)
- [ ] Tip button sends transactions successfully
- [ ] (Optional) NFT contract deployed and minting works

## 🐛 Troubleshooting

### "Mirror Node error" in dashboard
- Check that VITE_TOPIC_ID matches the topic you created
- Wait a few seconds for the first messages to appear
- Verify the simulator is running and sending data

### "MetaMask not installed"
- Install MetaMask extension from metamask.io
- Refresh the page after installation

### "Transaction failed" when tipping
- Ensure you have test HBAR in your account
- Check that VITE_DONATION_ADDRESS is set correctly in web/.env
- Verify MetaMask is on Hedera Testnet (chainId 296)

### Server won't start
- Check that MY_ACCOUNT_ID and MY_PRIVATE_KEY are correct
- Ensure TOPIC_ID is set in server/.env
- Verify port 8787 is not in use

### Contract deployment fails
- Verify PRIVATE_KEY is the ECDSA hex key (starts with 0x)
- Ensure you have test HBAR in your account
- Check that HASHIO_RPC URL is correct

## 🎓 Next Steps

### For Development:
1. Customize the simulator to match your sensor data
2. Add more fields to the telemetry payload
3. Create custom NFT metadata with IPFS
4. Add authentication to the server

### For Production:
1. Connect real Arduino/ESP32 devices
2. Deploy server to cloud (Heroku, DigitalOcean, AWS)
3. Use mainnet credentials and real HBAR
4. Add proper error handling and logging
5. Implement database for historical data

## 📚 Additional Resources

- [Hedera Documentation](https://docs.hedera.com)
- [Hedera SDK for JavaScript](https://docs.hedera.com/hedera/sdks-and-apis/sdks)
- [Mirror Node REST API](https://docs.hedera.com/hedera/sdks-and-apis/rest-api)
- [Hashio JSON-RPC](https://swirlds.com/hashio)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)

## 🆘 Getting Help

If you encounter issues:
1. Check the terminal logs for error messages
2. Verify all .env files are configured correctly
3. Ensure you have test HBAR in your account
4. Check that all ports (8787, 5173) are available
5. Review the troubleshooting section above

---

**🎉 Congratulations!** You now have a fully functional classroom air quality monitoring system with blockchain verification and NFT badges!
