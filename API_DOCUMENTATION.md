# 🔌 EduAir API Documentation

Complete API reference for the EduAir Proof Node system.

## 📡 Server API

Base URL (Development): `http://localhost:8787`
Base URL (Production): `https://your-domain.com`

### Authentication

Currently no authentication required for development. Production should implement API keys.

**Production Example:**
```
Headers:
  X-API-Key: your-api-key-here
  Content-Type: application/json
```

---

## Endpoints

### GET /

**Description:** Health check endpoint

**Response:**
```json
{
  "status": "healthy",
  "service": "EduAir HCS API",
  "topicId": "0.0.xxxxx"
}
```

**Status Codes:**
- `200 OK` - Service is healthy

**Example:**
```bash
curl http://localhost:8787/
```

---

### POST /ingest

**Description:** Submit classroom telemetry data to Hedera Consensus Service

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "deviceId": "string (required)",
  "sensors": {
    "temp": "number (required)",
    "hum": "number (required)",
    "pm25": "number (optional)"
  },
  "session": "string (optional)",
  "attendance": ["string"] (optional)
}
```

**Field Descriptions:**

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `deviceId` | string | Yes | Unique device identifier | "classroom-101" |
| `sensors` | object | Yes | Sensor readings object | See below |
| `sensors.temp` | number | Yes | Temperature in Celsius | 23.5 |
| `sensors.hum` | number | Yes | Humidity percentage | 45.2 |
| `sensors.pm25` | number | No | PM2.5 air quality (µg/m³) | 12.0 |
| `session` | string | No | Class session identifier | "morning" |
| `attendance` | array | No | List of student IDs | ["student1", "student2"] |

**Response (Success):**
```json
{
  "status": "success",
  "consensusTimestamp": "1234567890.123456789",
  "topicId": "0.0.xxxxx"
}
```

**Response (Error):**
```json
{
  "status": "error",
  "message": "Missing deviceId or sensors"
}
```

**Status Codes:**
- `200 OK` - Data published successfully
- `400 Bad Request` - Invalid request body
- `500 Internal Server Error` - HCS submission failed

**Example (cURL):**
```bash
curl -X POST http://localhost:8787/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "classroom-101",
    "sensors": {
      "temp": 23.5,
      "hum": 45.2,
      "pm25": 12.0
    },
    "session": "morning",
    "attendance": ["alice", "bob", "charlie"]
  }'
```

**Example (JavaScript/Fetch):**
```javascript
const response = await fetch('http://localhost:8787/ingest', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    deviceId: 'classroom-101',
    sensors: {
      temp: 23.5,
      hum: 45.2,
      pm25: 12.0
    },
    session: 'morning',
    attendance: ['alice', 'bob', 'charlie']
  })
});

const data = await response.json();
console.log(data);
```

**Example (Python):**
```python
import requests
import json

url = 'http://localhost:8787/ingest'
payload = {
    'deviceId': 'classroom-101',
    'sensors': {
        'temp': 23.5,
        'hum': 45.2,
        'pm25': 12.0
    },
    'session': 'morning',
    'attendance': ['alice', 'bob', 'charlie']
}

response = requests.post(url, json=payload)
print(response.json())
```

**Example (Arduino/ESP32):**
```cpp
HTTPClient http;
http.begin("http://your-server:8787/ingest");
http.addHeader("Content-Type", "application/json");

String payload = "{\"deviceId\":\"classroom-101\",";
payload += "\"sensors\":{\"temp\":23.5,\"hum\":45.2}}";

int httpCode = http.POST(payload);
String response = http.getString();
http.end();
```

---

## 🪞 Mirror Node API

Base URL: `https://testnet.mirrornode.hedera.com` (testnet)
Base URL: `https://mainnet.mirrornode.hedera.com` (mainnet)

Documentation: https://docs.hedera.com/hedera/sdks-and-apis/rest-api

### GET /api/v1/topics/{topicId}/messages

**Description:** Retrieve messages from an HCS topic

**Parameters:**

| Parameter | Type | Required | Description | Default |
|-----------|------|----------|-------------|---------|
| `topicId` | string | Yes | HCS topic ID | - |
| `limit` | number | No | Max messages to return | 25 |
| `order` | string | No | Sort order: 'asc' or 'desc' | asc |

**Example Request:**
```
GET https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.xxxxx/messages?limit=50&order=desc
```

**Response:**
```json
{
  "messages": [
    {
      "consensus_timestamp": "1234567890.123456789",
      "message": "base64-encoded-content",
      "payer_account_id": "0.0.xxxxx",
      "running_hash": "...",
      "running_hash_version": 3,
      "sequence_number": 1,
      "topic_id": "0.0.xxxxx"
    }
  ],
  "links": {
    "next": "/api/v1/topics/0.0.xxxxx/messages?limit=50&sequencenumber=lt:1"
  }
}
```

**Decoding Messages (JavaScript):**
```javascript
const messages = apiResponse.messages.map(msg => {
  const decoded = Buffer.from(msg.message, 'base64').toString('utf-8');
  return JSON.parse(decoded);
});
```

**Example (Complete):**
```javascript
async function fetchTopicMessages(topicId, limit = 50) {
  const url = `https://testnet.mirrornode.hedera.com/api/v1/topics/${topicId}/messages?limit=${limit}&order=desc`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  return data.messages.map(msg => {
    const decoded = Buffer.from(msg.message, 'base64').toString('utf-8');
    return {
      ...JSON.parse(decoded),
      consensusTimestamp: msg.consensus_timestamp,
      sequenceNumber: msg.sequence_number
    };
  });
}
```

---

## 🔗 Hashio JSON-RPC API

Base URL (Testnet): `https://testnet.hashio.io/api`
Base URL (Mainnet): `https://mainnet.hashio.io/api`

Compatible with standard Ethereum JSON-RPC methods.

### eth_chainId

**Description:** Get current chain ID

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "eth_chainId",
  "params": [],
  "id": 1
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x128"
}
```

Note: `0x128` = 296 (Hedera Testnet)

### eth_sendTransaction

**Description:** Send HBAR transaction (via MetaMask/Ethers)

**Example (Ethers.js v6):**
```javascript
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

const tx = await signer.sendTransaction({
  to: '0xRecipientAddress',
  value: ethers.parseEther('0.001') // 0.001 HBAR
});

await tx.wait();
console.log('Transaction hash:', tx.hash);
```

### eth_call

**Description:** Call smart contract function (read-only)

**Example:**
```javascript
const contract = new ethers.Contract(
  contractAddress,
  ['function totalSupply() view returns (uint256)'],
  provider
);

const supply = await contract.totalSupply();
```

### eth_sendRawTransaction

**Description:** Send signed transaction

Used internally by Ethers.js/Web3.js when calling contract functions.

---

## 📜 Smart Contract API

### EduAirBadge Contract

**Address (Testnet):** `0xYourDeployedAddress`
**Type:** ERC-721 NFT

#### Functions

##### mint

```solidity
function mint(address to, string memory uri) public onlyOwner
```

**Description:** Mint new badge to recipient (owner only)

**Parameters:**
- `to` (address): Recipient address
- `uri` (string): Token metadata URI (IPFS or HTTP)

**Example (Ethers.js):**
```javascript
const contract = new ethers.Contract(
  contractAddress,
  ['function mint(address to, string uri) public'],
  signer
);

const tx = await contract.mint(
  recipientAddress,
  'ipfs://QmExampleHash'
);

await tx.wait();
```

##### mintBatch

```solidity
function mintBatch(address[] memory recipients, string[] memory uris) public onlyOwner
```

**Description:** Mint multiple badges at once

**Example:**
```javascript
const tx = await contract.mintBatch(
  ['0xAddr1', '0xAddr2', '0xAddr3'],
  ['ipfs://Qm1', 'ipfs://Qm2', 'ipfs://Qm3']
);
```

##### totalSupply

```solidity
function totalSupply() public view returns (uint256)
```

**Description:** Get total number of badges minted

**Example:**
```javascript
const supply = await contract.totalSupply();
console.log(`Total badges: ${supply.toString()}`);
```

##### ownerOf

```solidity
function ownerOf(uint256 tokenId) public view returns (address)
```

**Description:** Get owner of a specific badge

##### tokenURI

```solidity
function tokenURI(uint256 tokenId) public view returns (string)
```

**Description:** Get metadata URI for a badge

**Example:**
```javascript
const uri = await contract.tokenURI(0);
console.log('Metadata:', uri);
```

---

## 🔄 Rate Limits

### Development (No Limits)
- Unlimited requests
- No authentication required

### Production (Recommended)
- **Per IP:** 100 requests / 15 minutes
- **Per API Key:** 1000 requests / hour
- **Mirror Node:** Built-in rate limiting by Hedera

---

## ❌ Error Codes

| HTTP Code | Meaning | Action |
|-----------|---------|--------|
| 200 | Success | - |
| 400 | Bad Request | Check request body format |
| 401 | Unauthorized | Add API key header |
| 404 | Not Found | Check endpoint URL |
| 429 | Too Many Requests | Wait before retrying |
| 500 | Server Error | Check server logs |

---

## 📊 Data Models

### Telemetry Message

```typescript
interface TelemetryMessage {
  deviceId: string;          // "classroom-101"
  sensors: {
    temp: number;            // Celsius
    hum: number;             // Percentage
    pm25?: number;           // µg/m³ (optional)
  };
  session?: string;          // "morning" | "afternoon" | "evening"
  attendance?: string[];     // ["student1", "student2"]
  ts?: number;               // Unix timestamp (auto-added by server)
}
```

### HCS Message (On Chain)

```typescript
interface HCSMessage {
  consensusTimestamp: string;    // "1234567890.123456789"
  message: string;                // base64-encoded JSON
  payerAccountId: string;         // "0.0.xxxxx"
  sequenceNumber: number;         // 1, 2, 3...
  topicId: string;                // "0.0.xxxxx"
}
```

### Transaction Response

```typescript
interface TransactionResponse {
  status: "success" | "error";
  consensusTimestamp?: string;
  topicId?: string;
  message?: string;  // Error message if status is "error"
}
```

---

## 🧪 Testing the API

### Using cURL

```bash
# Health check
curl http://localhost:8787/

# Submit data
curl -X POST http://localhost:8787/ingest \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"test","sensors":{"temp":23,"hum":45}}'

# Check Mirror Node
curl "https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.xxxxx/messages?limit=5"
```

### Using Postman

1. Import collection from `api/postman-collection.json`
2. Set environment variables
3. Run test suite

### Using Jest

```javascript
describe('API Tests', () => {
  test('POST /ingest returns success', async () => {
    const response = await fetch('http://localhost:8787/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: 'test',
        sensors: { temp: 23, hum: 45 }
      })
    });
    
    const data = await response.json();
    expect(data.status).toBe('success');
    expect(data.consensusTimestamp).toBeDefined();
  });
});
```

---

## 📚 SDK Examples

### Node.js

```javascript
const eduair = {
  baseUrl: 'http://localhost:8787',
  
  async submitTelemetry(deviceId, sensors, options = {}) {
    const response = await fetch(`${this.baseUrl}/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId,
        sensors,
        ...options
      })
    });
    return response.json();
  }
};

// Usage
const result = await eduair.submitTelemetry('classroom-101', {
  temp: 23.5,
  hum: 45.2
}, {
  session: 'morning',
  attendance: ['alice', 'bob']
});
```

### Python

```python
class EduAirClient:
    def __init__(self, base_url='http://localhost:8787'):
        self.base_url = base_url
    
    def submit_telemetry(self, device_id, sensors, **kwargs):
        payload = {
            'deviceId': device_id,
            'sensors': sensors,
            **kwargs
        }
        response = requests.post(
            f'{self.base_url}/ingest',
            json=payload
        )
        return response.json()

# Usage
client = EduAirClient()
result = client.submit_telemetry(
    'classroom-101',
    {'temp': 23.5, 'hum': 45.2},
    session='morning'
)
```

---

## 🔗 Related Documentation

- [Server README](../server/README.md) - Implementation details
- [SECURITY.md](./SECURITY.md) - Security best practices
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common API issues

---

**API Version:** 1.0.0  
**Last Updated:** September 30, 2025
