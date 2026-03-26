import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 에러 유형
 */
export type ErrorType = 'Basic' | 'Complex';

/**
 * 에러 로그 항목
 */
export interface DiagnosticLogEntry {
    message: string;
    severity: vscode.DiagnosticSeverity;
    startTime: number;
    endTime: number;
    duration: number;
    type: ErrorType;
}

/**
 * 타이핑 이벤트 (초 단위 묶음)
 */
export interface TypingEvent {
    timestamp: number;
    count: number;
}

/**
 * 언어별 에러 분류 규칙 정의
 */
const ERROR_RULES: Record<string, { basicKeywords: string[], basicCodes: (string | number)[] }> = {
    'python': {
        basicKeywords: ['indentation', 'expected', 'syntax', 'unexpected token'],
        basicCodes: ['unused-import', 'line-too-long', 'E0001', 'F401']
    },
    'javascript': {
        basicKeywords: ['expected', 'is not defined', 'unexpected token', 'missing'],
        basicCodes: ['parsing-error', 'no-unused-vars']
    },
    'typescript': {
        basicKeywords: ['expected', 'is not defined', 'unexpected token', 'missing'],
        basicCodes: [
            '2304', // Cannot find name
            '2552', // Cannot find name (with suggestion)
            '1005', // Expected ';'
            '1109', // Expression expected
            '6133'  // Unused variable
        ]
    },
    'cpp': {
        basicKeywords: ['expected', 'was not declared', 'missing', 'syntax'],
        basicCodes: []
    }
};

/**
 * 번아웃 감지를 위한 행동 데이터 수집기
 */
export class BurnoutTracker {
    public typingEvents: TypingEvent[] = [];
    public diagnosticLogs: DiagnosticLogEntry[] = [];
    public actionLogs: { command: string, timestamp: number }[] = [];
    private logPath: string;
    private userId: string;
    private isConsentGiven: boolean = false;
    private activeDiagnostics: Map<string, { startTime: number, diagnostic: vscode.Diagnostic, languageId: string }> = new Map();

    // 서버 URL (로컬 백엔드 서버 주소)
    private readonly SERVER_URL = "http://localhost:5000/api/upload";

    constructor(context: vscode.ExtensionContext) {
        this.logPath = path.join(context.globalStoragePath, 'burnout_log.json');
        this.userId = this.getOrCreateUserId(context);
        this.isConsentGiven = context.globalState.get('burnoutConsent', false);
        
        if (!fs.existsSync(context.globalStoragePath)) {
            fs.mkdirSync(context.globalStoragePath, { recursive: true });
        }
    }

    private getOrCreateUserId(context: vscode.ExtensionContext): string {
        let id = context.globalState.get<string>('burnoutUserId');
        if (!id) {
            id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            context.globalState.update('burnoutUserId', id);
        }
        return id;
    }

    public async checkConsent(): Promise<boolean> {
        if (this.isConsentGiven) return true;

        const selection = await vscode.window.showInformationMessage(
            "번아웃 감지 연구를 위해 익명화된 행동 데이터를 수집해도 될까요? (타이핑 속도, 에러 해결 패턴 등)",
            "동의함", "거절"
        );

        if (selection === "동의함") {
            this.isConsentGiven = true;
            await vscode.workspace.getConfiguration().update('burnoutDetector.enableDataCollection', true, vscode.ConfigurationTarget.Global);
            return true;
        }
        return false;
    }

    public async saveLogs() {
        const config = vscode.workspace.getConfiguration('burnoutDetector');
        const isCollectionEnabled = config.get<boolean>('enableDataCollection', false);
        const serverUrl = config.get<string>('serverUrl', 'http://localhost:5000/api/upload');

        const data = {
            userId: this.userId,
            timestamp: Date.now(),
            typingEvents: this.typingEvents,
            diagnosticLogs: this.diagnosticLogs,
            actionLogs: this.actionLogs,
            summary: {
                totalTypingChars: this.typingEvents.reduce((acc, curr) => acc + curr.count, 0),
                totalErrorsResolved: this.diagnosticLogs.length,
                totalActionsCaptured: this.actionLogs.length
            }
        };
        fs.writeFileSync(this.logPath, JSON.stringify(data, null, 2));

        // 데이터가 일정량 쌓이고, 동의가 된 경우에만 전송
        const totalEvents = this.typingEvents.length + this.diagnosticLogs.length + this.actionLogs.length;
        if (isCollectionEnabled && totalEvents >= 10) {
            this.uploadData(data, serverUrl);
        }
    }

    private async uploadData(data: any, url: string) {
        console.log(`Uploading data to ${url}...`, this.userId);
        try {
            const response = await fetch(url, {
                method: 'POST',
                body: JSON.stringify(data),
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                console.log("Upload successful!");
                this.typingEvents = [];
                this.diagnosticLogs = [];
                this.actionLogs = [];
                this.saveLogs(); 
            } else {
                console.error("Upload failed with status:", response.status);
            }
        } catch (e) {
            console.error("Upload failed", e);
        }
    }

    public trackDocumentChange(event: vscode.TextDocumentChangeEvent) {
        const now = Date.now();
        const secondTimestamp = Math.floor(now / 1000) * 1000;

        if (event.reason === vscode.TextDocumentChangeReason.Undo) {
            this.actionLogs.push({ command: 'undo', timestamp: now });
        } else if (event.reason === vscode.TextDocumentChangeReason.Redo) {
            this.actionLogs.push({ command: 'redo', timestamp: now });
        }

        let totalCharsAdded = 0;
        event.contentChanges.forEach(change => {
            if (change.text.length > 0) totalCharsAdded += change.text.length;
        });

        if (totalCharsAdded > 0) {
            const lastEvent = this.typingEvents[this.typingEvents.length - 1];
            if (lastEvent && lastEvent.timestamp === secondTimestamp) {
                lastEvent.count += totalCharsAdded;
            } else {
                this.typingEvents.push({ timestamp: secondTimestamp, count: totalCharsAdded });
            }
        }
        this.saveLogs();
    }

    public trackDiagnostics(event: vscode.DiagnosticChangeEvent) {
        const now = Date.now();
        event.uris.forEach(uri => {
            const currentDiagnostics = vscode.languages.getDiagnostics(uri);
            const uriStr = uri.toString();
            
            // 현재 문서의 languageId 가져오기 (문서가 열려있는 경우)
            const document = vscode.workspace.textDocuments.find(doc => doc.uri.toString() === uriStr);
            const languageId = document?.languageId || 'unknown';

            currentDiagnostics.forEach(d => {
                const key = `${uriStr}-${d.message}-${d.range.start.line}-${d.range.start.character}`;
                if (!this.activeDiagnostics.has(key)) {
                    this.activeDiagnostics.set(key, { startTime: now, diagnostic: d, languageId: languageId });
                }
            });

            for (const [key, value] of this.activeDiagnostics.entries()) {
                if (key.startsWith(uriStr)) {
                    const isStillActive = currentDiagnostics.some(d => 
                        `${uriStr}-${d.message}-${d.range.start.line}-${d.range.start.character}` === key
                    );

                    if (!isStillActive) {
                        const endTime = now;
                        const duration = endTime - value.startTime;
                        const type = this.categorizeError(value.diagnostic, value.languageId);

                        this.diagnosticLogs.push({
                            message: value.diagnostic.message,
                            severity: value.diagnostic.severity,
                            startTime: value.startTime,
                            endTime: endTime,
                            duration: duration,
                            type: type
                        });
                        this.activeDiagnostics.delete(key);
                    }
                }
            }
        });
        this.saveLogs();
    }

    public categorizeError(diagnostic: vscode.Diagnostic, languageId: string): ErrorType {
        const rules = ERROR_RULES[languageId];
        const message = diagnostic.message.toLowerCase();
        const code = diagnostic.code?.toString();

        // 1. 공통적인 Basic 키워드 (언어 불문)
        const commonBasicKeywords = ['expected', 'unexpected', 'missing', 'syntax', 'undefined', 'not found', 'cannot find'];
        
        // 2. 언어별 규칙 적용
        if (rules) {
            // 에러 코드로 판단
            if (code && rules.basicCodes.map(c => c.toString()).includes(code)) {
                return 'Basic';
            }
            // 언어별 키워드로 판단
            if (rules.basicKeywords.some(kw => message.includes(kw))) {
                return 'Basic';
            }
        }

        // 3. 공통 키워드로 판단 (fallback)
        if (commonBasicKeywords.some(kw => message.includes(kw))) {
            return 'Basic';
        }

        // 그 외는 복잡한 에러(논리 에러 등)로 분류
        return 'Complex';
    }
}
