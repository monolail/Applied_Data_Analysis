const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// 미들웨어 설정
app.use(helmet()); 
app.use(cors());
app.use(express.json({ limit: '1mb' })); 

// MongoDB 연결 설정
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('CRITICAL ERROR: MONGODB_URI is not defined in environment variables.');
    process.exit(1);
}

// Mongoose 연결 이벤트 모니터링
mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB Atlas Connected Successfully');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB Connection Error:', err.message);
});

mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB Disconnected. Attempting to reconnect...');
});

const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
    } catch (err) {
        console.error('❌ Initial MongoDB Connection Failed:', err.message);
        setTimeout(connectDB, 5000);
    }
};

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
        dbStatus: mongoose.connection.readyState === 1 ? 'Connected' : 
                  mongoose.connection.readyState === 2 ? 'Connecting' : 'Disconnected'
    });
});

// 데이터 업로드 API
app.post('/api/upload', async (req, res) => {
    try {
        const { userId, summary } = req.body;
        
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

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

// 서버 시작 (DB 연결 시도 후)
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);
        console.log(`Health check available at: http://localhost:${PORT}/health`);
    });
});
