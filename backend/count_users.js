const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function checkUniqueUsers() {
    try {
        await mongoose.connect(MONGODB_URI);
        const BurnoutLog = mongoose.model('BurnoutLog', new mongoose.Schema({}, { strict: false }));
        
        const uniqueUsers = await BurnoutLog.distinct('userId');
        const totalLogs = await BurnoutLog.countDocuments();
        
        console.log(`총 로그 수: ${totalLogs}`);
        console.log(`총 고유 사용자 수: ${uniqueUsers.length}명`);
        console.log('사용자 ID 목록:', uniqueUsers);

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkUniqueUsers();
