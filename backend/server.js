const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json());

// MongoDB 연결 (로컬 또는 MongoDB Atlas URI)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/burnout_db';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// 번아웃 로그 스키마 정의 (더 유연하게 수정)
const BurnoutLogSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    typingEvents: [mongoose.Schema.Types.Mixed],
    diagnosticLogs: [mongoose.Schema.Types.Mixed],
    actionLogs: [mongoose.Schema.Types.Mixed],
    summary: mongoose.Schema.Types.Mixed
}, { strict: false }); // 정의되지 않은 필드도 저장 허용

const BurnoutLog = mongoose.model('BurnoutLog', BurnoutLogSchema);

// 데이터 업로드 API
app.post('/api/upload', async (req, res) => {
    try {
        console.log(`Received data from user: ${req.body.userId}`);
        const newLog = new BurnoutLog(req.body);
        await newLog.save();
        console.log(`Log saved successfully!`);
        res.status(201).json({ message: 'Data saved successfully' });
    } catch (err) {
        console.error('Save error detailed:', err);
        res.status(500).json({ error: 'Failed to save data', details: err.message });
    }
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
