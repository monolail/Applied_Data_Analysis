const mongoose = require('mongoose');
require('dotenv').config();

async function checkStats() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const BurnoutLog = mongoose.model('BurnoutLog', new mongoose.Schema({}, { strict: false }));
        
        // 날짜별 통계
        const stats = await BurnoutLog.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
                    count: { $sum: 1 },
                    uniqueUsers: { $addToSet: "$userId" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        console.log('\n--- [ 날짜별 데이터 수집 통계 ] ---');
        stats.forEach(s => {
            console.log(`날짜: ${s._id} | 로그 수: ${s.count}개 | 유저 수: ${s.uniqueUsers.length}명`);
        });

        // 유저별 첫 활동 & 마지막 활동
        const userStats = await BurnoutLog.aggregate([
            {
                $group: {
                    _id: "$userId",
                    firstSeen: { $min: "$timestamp" },
                    lastSeen: { $max: "$timestamp" },
                    totalLogs: { $sum: 1 }
                }
            }
        ]);

        console.log('\n--- [ 유저별 활동 기간 ] ---');
        userStats.forEach(u => {
            console.log(`유저ID: ${u._id}`);
            console.log(`  - 첫 활동: ${u.firstSeen.toLocaleString()}`);
            console.log(`  - 최근 활동: ${u.lastSeen.toLocaleString()}`);
            console.log(`  - 총 로그 수: ${u.totalLogs}개`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error('통계 확인 중 오류 발생:', err);
    }
}

checkStats();
