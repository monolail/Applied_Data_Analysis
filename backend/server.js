const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// 미들웨어 설정
app.use(helmet()); 
app.use(cors());
app.use(bodyParser.json({ limit: '1mb' })); 

// MongoDB 연결 설정
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('CRITICAL ERROR: MONGODB_URI is not defined in environment variables.');
    process.exit(1);
}

const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000, // 5초 이내에 서버 선택 실패 시 에러
            socketTimeoutMS: 45000,        // 45초 후 소켓 타임아웃
        });
        console.log('✅ MongoDB Atlas Connected Successfully');
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err.message);
        // 5초 후 재시도
        setTimeout(connectDB, 5000);
    }
};

connectDB();

// 번아웃 로그 스키마 정의
const BurnoutLogSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    timestamp: { type: Date, default: Date.now },
    typingEvents: [mongoose.Schema.Types.Mixed],
    diagnosticLogs: [mongoose.Schema.Types.Mixed],
    actionLogs: [mongoose.Schema.Types.Mixed],
    summary: mongoose.Schema.Types.Mixed
}, { strict: false });

const BurnoutLog = mongoose.model('BurnoutLog', BurnoutLogSchema);

// 상태 체크 API
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        time: new Date().toISOString(),
        dbStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
});

// 데이터 업로드 API
app.post('/api/upload', async (req, res) => {
    try {
        const { userId, summary } = req.body;
        console.log(`[${new Date().toISOString()}] Received data from user: ${userId}`);
        
        if (summary) {
            console.log(`Summary - Typings: ${summary.totalTypingChars}, Errors: ${summary.totalErrorsResolved}`);
        }

        const newLog = new BurnoutLog(req.body);
        await newLog.save();
        
        res.status(201).json({ 
            success: true,
            message: 'Data saved to Atlas successfully' 
        });
    } catch (err) {
        console.error('❌ Data Save Error:', err);
        res.status(500).json({ error: 'Failed to save data to database' });
    }
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`Health check available at: http://localhost:${PORT}/health`);
});
