import * as assert from 'assert';
import { BurnoutTracker } from '../tracker';

suite('BurnoutTracker Test Suite', () => {
    // Mock Context
    const mockContext: any = {
        globalStoragePath: './test_storage'
    };

    test('Error Categorization - Basic', () => {
        const tracker = new BurnoutTracker(mockContext);
        assert.strictEqual(tracker.categorizeError('Syntax error: expected semicolon'), 'Basic');
        assert.strictEqual(tracker.categorizeError('Variable "x" is not defined'), 'Basic');
        assert.strictEqual(tracker.categorizeError('Unexpected token'), 'Basic');
    });

    test('Error Categorization - Complex', () => {
        const tracker = new BurnoutTracker(mockContext);
        assert.strictEqual(tracker.categorizeError('Network error: connection refused'), 'Complex');
        assert.strictEqual(tracker.categorizeError('Database transaction failed'), 'Complex');
    });
});
