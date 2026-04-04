import * as vscode from 'vscode';
import { BurnoutTracker } from './tracker';

let tracker: BurnoutTracker | null = null;

export async function activate(context: vscode.ExtensionContext) {
    console.log('Burnout Detector Activated');
    
    tracker = new BurnoutTracker(context);
    
    // 사용 동의 확인
    await tracker.checkConsent();

    // 1 & 4. 타이핑 및 Undo/Redo 추적
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(e => tracker?.trackDocumentChange(e))
    );

    // 2 & 3. 에러 추적
    context.subscriptions.push(
        vscode.languages.onDidChangeDiagnostics(e => tracker?.trackDiagnostics(e))
    );

    // 5. 파일 전환 추적 (v0.2.0 추가)
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(e => tracker?.trackFileSwitch(e))
    );
}

export function deactivate() {
    console.log('Burnout Detector Deactivated');
}