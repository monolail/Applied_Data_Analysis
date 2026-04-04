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
    pasteCount: number; // 붙여넣기된 글자 수 추가
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
        basicCodes: ['2304', '2552', '1005', '1109', '6133']
    },
    'cpp': {
        basicKeywords: ['expected', 'was not declared', 'missing', 'syntax'],
        basicCodes: []
    }
};

/**
 * 번아웃 감지를 위한 행동 데이터 수집기 v0.2.0
 */
export class BurnoutTracker {
    public typingEvents: TypingEvent[] = [];
    public diagnosticLogs: DiagnosticLogEntry[] = [];
    public actionLogs: { command: string, timestamp: number }[] = [];
    public fileSwitches: { from: string, to: string, timestamp: number }[] = [];
    
    private context: vscode.ExtensionContext;
    private logPath: string;
    private userId: string;
    private isConsentGiven: boolean = false;
    private activeDiagnostics: Map<string, { startTime: number, diagnostic: vscode.Diagnostic, languageId: string }> = new Map();
    
    private lastActivityTime: number = Date.now();
    private totalIdleTime: number = 0; // ms 단위
    private totalCharsDeleted: number = 0;
    private currentVersion: string = "0.2.2";

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
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
            "Hello, fellow developer! Could you please help a student's research on burnout? Only anonymous behavior data is collected. Your 1 minute can save my graduation! / 개발자님의 1분으로 학생의 졸업 연구를 살릴 수 있습니다. 익명 데이터 수집에 동의해 주세요!",
            "Yes, I will help (동의함)", "No (거절)"
        );

        if (selection === "Yes, I will help (동의함)") {
            this.isConsentGiven = true;
            await vscode.workspace.getConfiguration().update('burnoutDetector.enableDataCollection', true, vscode.ConfigurationTarget.Global);
            this.context.globalState.update('burnoutConsent', true);
            return true;
        }
        return false;
    }

    /**
     * 유휴 시간 계산 (30초 이상 활동이 없을 때 기록)
     */
    private updateIdleTime() {
        const now = Date.now();
        const diff = now - this.lastActivityTime;
        if (diff > 30000) { // 30초 초과 시 유휴 시간으로 간주
            this.totalIdleTime += diff;
            console.log(`[BurnoutDetector] Idle detected: ${diff/1000}s. Total: ${this.totalIdleTime/1000}s`);
        }
        this.lastActivityTime = now;
    }

    public async saveLogs() {
        const config = vscode.workspace.getConfiguration('burnoutDetector');
        const isCollectionEnabled = config.get<boolean>('enableDataCollection', false);
        const serverUrl = config.get<string>('serverUrl', 'https://burnout-backend-zr5p.onrender.com/api/upload');

        const data = {
            userId: this.userId,
            version: this.currentVersion,
            timestamp: Date.now(),
            typingEvents: this.typingEvents,
            diagnosticLogs: this.diagnosticLogs,
            actionLogs: this.actionLogs,
            fileSwitches: this.fileSwitches,
            idleTimeMs: this.totalIdleTime,
            charsDeleted: this.totalCharsDeleted,
            summary: {
                totalTypingChars: this.typingEvents.reduce((acc, curr) => acc + curr.count, 0),
                totalPasteChars: this.typingEvents.reduce((acc, curr) => acc + curr.pasteCount, 0),
                totalErrorsResolved: this.diagnosticLogs.length,
                totalActionsCaptured: this.actionLogs.length,
                totalFileSwitches: this.fileSwitches.length
            }
        };
        fs.writeFileSync(this.logPath, JSON.stringify(data, null, 2));

        const totalEvents = this.typingEvents.length + this.diagnosticLogs.length + this.actionLogs.length + this.fileSwitches.length;
        if (isCollectionEnabled && totalEvents >= 20) { // 데이터 양이 좀 더 쌓였을 때 전송
            this.uploadData(data, serverUrl);
        }
    }

    private async uploadData(data: any, url: string, retries: number = 3) {
        console.log(`[BurnoutDetector] Attempting to upload v${this.currentVersion} data to ${url}...`);
        
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    body: JSON.stringify(data),
                    headers: { 'Content-Type': 'application/json' }
                });

                if (response.ok) {
                    console.log(`[BurnoutDetector] Upload successful! (Attempt ${attempt})`);
                    this.resetLogs();
                    await this.saveLogs(); 
                    return;
                } else {
                    const errorText = await response.text();
                    console.error(`[BurnoutDetector] Upload failed. Status: ${response.status}, Error: ${errorText}`);
                }
            } catch (e) {
                console.error(`[BurnoutDetector] Upload error:`, e);
            }

            if (attempt < retries) {
                const delay = Math.pow(2, attempt) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    private resetLogs() {
        this.typingEvents = [];
        this.diagnosticLogs = [];
        this.actionLogs = [];
        this.fileSwitches = [];
        this.totalIdleTime = 0;
        this.totalCharsDeleted = 0;
    }

    public trackDocumentChange(event: vscode.TextDocumentChangeEvent) {
        this.updateIdleTime();
        const now = Date.now();
        const secondTimestamp = Math.floor(now / 1000) * 1000;

        if (event.reason === vscode.TextDocumentChangeReason.Undo) {
            this.actionLogs.push({ command: 'undo', timestamp: now });
        } else if (event.reason === vscode.TextDocumentChangeReason.Redo) {
            this.actionLogs.push({ command: 'redo', timestamp: now });
        }

        let totalCharsAdded = 0;
        let totalCharsPasted = 0;
        let totalDeleted = 0;

        event.contentChanges.forEach(change => {
            if (change.text.length > 0) {
                // 붙여넣기 감지: 한 번에 10글자 이상 들어오면 붙여넣기로 간주 (단순화)
                if (change.text.length > 10) {
                    totalCharsPasted += change.text.length;
                } else {
                    totalCharsAdded += change.text.length;
                }
            }
            if (change.rangeLength > 0) {
                totalDeleted += change.rangeLength;
            }
        });

        this.totalCharsDeleted += totalDeleted;

        if (totalCharsAdded > 0 || totalCharsPasted > 0) {
            const lastEvent = this.typingEvents[this.typingEvents.length - 1];
            if (lastEvent && lastEvent.timestamp === secondTimestamp) {
                lastEvent.count += totalCharsAdded;
                lastEvent.pasteCount += totalCharsPasted;
            } else {
                this.typingEvents.push({ 
                    timestamp: secondTimestamp, 
                    count: totalCharsAdded, 
                    pasteCount: totalCharsPasted 
                });
            }
        }
        this.saveLogs();
    }

    public trackFileSwitch(e: vscode.TextEditor | undefined) {
        if (!e) return;
        this.updateIdleTime();
        const now = Date.now();
        const fileName = path.basename(e.document.fileName);
        
        const lastSwitch = this.fileSwitches[this.fileSwitches.length - 1];
        const fromFile = lastSwitch ? lastSwitch.to : "unknown";
        
        if (fromFile !== fileName) {
            this.fileSwitches.push({
                from: fromFile,
                to: fileName,
                timestamp: now
            });
            this.saveLogs();
        }
    }

    public trackDiagnostics(event: vscode.DiagnosticChangeEvent) {
        const now = Date.now();
        event.uris.forEach(uri => {
            const currentDiagnostics = vscode.languages.getDiagnostics(uri);
            const uriStr = uri.toString();
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
                        this.diagnosticLogs.push({
                            message: value.diagnostic.message,
                            severity: value.diagnostic.severity,
                            startTime: value.startTime,
                            endTime: endTime,
                            duration: duration,
                            type: this.categorizeError(value.diagnostic, value.languageId)
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
        const commonBasicKeywords = ['expected', 'unexpected', 'missing', 'syntax', 'undefined', 'not found', 'cannot find'];
        
        if (rules) {
            if (code && rules.basicCodes.map(c => c.toString()).includes(code)) return 'Basic';
            if (rules.basicKeywords.some(kw => message.includes(kw))) return 'Basic';
        }
        if (commonBasicKeywords.some(kw => message.includes(kw))) return 'Basic';
        return 'Complex';
    }
}
