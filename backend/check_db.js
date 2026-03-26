const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function checkData() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('--- DB Connected ---');

        const BurnoutLog = mongoose.model('BurnoutLog', new mongoose.Schema({}, { strict: false }));
        
        const logs = await BurnoutLog.find().sort({ timestamp: -1 }).limit(3); // 최신 3개만 가져오기
        
        if (logs.length === 0) {
            console.log('저장된 로그가 없습니다.');
        } else {
            console.log(`현재 총 ${await BurnoutLog.countDocuments()}개의 로그가 저장되어 있습니다.`);
            console.log('\n--- 최신 로그 3개 ---');
            console.log(JSON.stringify(logs, null, 2));
        }

        await mongoose.disconnect();
        console.log('\n--- DB Disconnected ---');
    } catch (err) {
        console.error('Error checking DB:', err);
    }
}

checkData();
