const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// 미들웨어 설정
app.use(helmet()); // 기본적인 보안 헤더 설정
app.use(cors());
app.use(bodyParser.json({ limit: '1mb' })); // 데이터 크기 제한 추가

// MongoDB 연결 (로컬 또는 MongoDB Atlas URI)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/burnout_db';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.error('MongoDB Connection Error:', err));

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

// 상태 체크 API (배포 후 확인용)
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Burnout Detector Server is running' });
});

// 데이터 업로드 API
app.post('/api/upload', async (req, res) => {
    try {
        console.log(`Received data from user: ${req.body.userId}`);
        const newLog = new BurnoutLog(req.body);
        await newLog.save();
        res.status(201).json({ message: 'Data saved successfully' });
    } catch (err) {
        console.error('Save error:', err);
        res.status(500).json({ error: 'Failed to save data' });
    }
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
