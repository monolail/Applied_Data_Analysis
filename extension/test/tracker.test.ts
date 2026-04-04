import * as assert from 'assert';
import * as vscode from 'vscode';
import { BurnoutTracker } from '../tracker';

suite('BurnoutTracker Test Suite', () => {
    // Mock Context
    const mockContext: any = {
        globalStoragePath: './test_storage',
        globalState: {
            get: (key: string) => undefined,
            update: (key: string, value: any) => Promise.resolve()
        }
    };

    const createMockDiagnostic = (message: string, code?: string): vscode.Diagnostic => {
        return {
            message,
            code,
            range: new vscode.Range(0, 0, 0, 0),
            severity: vscode.DiagnosticSeverity.Error
        } as vscode.Diagnostic;
    };

    test('Error Categorization - Basic', () => {
        const tracker = new BurnoutTracker(mockContext);
        
        // Python Indentation (Keyword)
        assert.strictEqual(tracker.categorizeError(createMockDiagnostic('IndentationError'), 'python'), 'Basic');
        // TypeScript Error Code
        assert.strictEqual(tracker.categorizeError(createMockDiagnostic('Expected semicolon', '1005'), 'typescript'), 'Basic');
        // Common Keyword
        assert.strictEqual(tracker.categorizeError(createMockDiagnostic('syntax error'), 'javascript'), 'Basic');
    });

    test('Error Categorization - Complex', () => {
        const tracker = new BurnoutTracker(mockContext);
        assert.strictEqual(tracker.categorizeError(createMockDiagnostic('Logical flaw in algorithm'), 'python'), 'Complex');
        assert.strictEqual(tracker.categorizeError(createMockDiagnostic('Performance degradation detected'), 'cpp'), 'Complex');
    });
});
