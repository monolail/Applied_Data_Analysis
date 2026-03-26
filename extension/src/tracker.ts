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
 * 번아웃 감지를 위한 행동 데이터 수집기
 */
export class BurnoutTracker {
    public typingEvents: TypingEvent[] = [];
    public diagnosticLogs: DiagnosticLogEntry[] = [];
    public actionLogs: { command: string, timestamp: number }[] = [];
    private logPath: string;
    private userId: string;
    private isConsentGiven: boolean = false;

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

    public saveLogs() {
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

        // 데이터가 일정량 쌓이면 서버로 전송 (예: 이벤트 10개 이상으로 테스트를 위해 낮춤)
        if (this.isConsentGiven && (this.typingEvents.length + this.diagnosticLogs.length + this.actionLogs.length) >= 10) {
            this.uploadData(data);
        }
    }

    private async uploadData(data: any) {
        console.log("Uploading data to server...", this.userId);
        try {
            const response = await fetch(this.SERVER_URL, {
                method: 'POST',
                body: JSON.stringify(data),
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                console.log("Upload successful!");
                // 전송 성공 시 로컬 로그 초기화하여 중복 전송 방지
                this.typingEvents = [];
                this.diagnosticLogs = [];
                this.actionLogs = [];
                this.saveLogs(); // 초기화된 상태 저장
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

            currentDiagnostics.forEach(d => {
                const key = `${uriStr}-${d.message}-${d.range.start.line}-${d.range.start.character}`;
                if (!this.activeDiagnostics.has(key)) {
                    this.activeDiagnostics.set(key, { startTime: now, diagnostic: d });
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
                        const type = this.categorizeError(value.diagnostic.message);

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

    private activeDiagnostics: Map<string, { startTime: number, diagnostic: vscode.Diagnostic }> = new Map();

    public categorizeError(message: string): ErrorType {
        const basicKeywords = ['expected', 'unexpected', 'not found', 'cannot find', 'syntax', 'undefined', 'null'];
        const isBasic = basicKeywords.some(kw => message.toLowerCase().includes(kw));
        return isBasic ? 'Basic' : 'Complex';
    }
}
