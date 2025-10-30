import { ethers } from 'ethers';

const HASHIO_RPC = import.meta.env.VITE_HASHIO_RPC || 'https://testnet.hashio.io/api';
const DONATION_ADDRESS = import.meta.env.VITE_DONATION_ADDRESS;
const HEDERA_CHAIN_ID = 296;

export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed');
  }

  const accounts = await window.ethereum.request({ 
    method: 'eth_requestAccounts' 
  });

  return accounts[0];
}

export async function ensureHederaNetwork() {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const network = await provider.getNetwork();
  
  if (Number(network.chainId) !== HEDERA_CHAIN_ID) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x128' }], // 296 in hex
      });
    } catch (switchError) {
      // Chain not added, add it
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x128',
            chainName: 'Hedera Testnet',
            nativeCurrency: {
              name: 'HBAR',
              symbol: 'HBAR',
              decimals: 18
            },
            rpcUrls: [HASHIO_RPC],
            blockExplorerUrls: ['https://hashscan.io/testnet']
          }]
        });
      } else {
        throw switchError;
      }
    }
  }
}

export async function sendTip() {
  if (!DONATION_ADDRESS) {
    throw new Error('VITE_DONATION_ADDRESS not set in .env');
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  const tx = await signer.sendTransaction({
    to: DONATION_ADDRESS,
    value: ethers.parseEther('0.001')
  });

  console.log('Transaction sent:', tx.hash);
  
  const receipt = await tx.wait();
  console.log('Transaction confirmed:', receipt.hash);

  return tx.hash;
}
