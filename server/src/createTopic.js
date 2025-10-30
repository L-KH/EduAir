import { Client, TopicCreateTransaction } from '@hashgraph/sdk';
import dotenv from 'dotenv';

dotenv.config();

async function createTopic() {
  const { MY_ACCOUNT_ID, MY_PRIVATE_KEY } = process.env;

  if (!MY_ACCOUNT_ID || !MY_PRIVATE_KEY) {
    throw new Error('Missing MY_ACCOUNT_ID or MY_PRIVATE_KEY in .env');
  }

  console.log('🔗 Connecting to Hedera Testnet...');
  
  const client = Client.forTestnet().setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);

  try {
    console.log('📝 Creating HCS topic...');
    
    const transaction = new TopicCreateTransaction()
      .setSubmitKey(client.operatorPublicKey)
      .setTopicMemo('EduAir Classroom Telemetry');

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);
    const topicId = receipt.topicId;

    console.log('✅ Topic created successfully!');
    console.log(`📌 Topic ID: ${topicId.toString()}`);
    console.log('\n💡 Add this to your .env files:');
    console.log(`   TOPIC_ID=${topicId.toString()}`);
    console.log(`   VITE_TOPIC_ID=${topicId.toString()}`);

    client.close();
  } catch (error) {
    console.error('❌ Error creating topic:', error.message);
    process.exit(1);
  }
}

createTopic();
