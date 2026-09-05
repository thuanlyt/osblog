import { expect, it } from 'vitest'
import { sqlStatements } from '../../src/server/sql-statements'
it('preserves semicolons in SQL strings, identifiers, comments and dollar-quoted bodies', () => {
  const statements = sqlStatements(`-- comment ;\nSELECT 'one;two', 'it''s;ok', "a;b"; /* outer ; /* nested */ */ DO $fn$ BEGIN PERFORM 1; END $fn$; SELECT 2;`)
  expect(statements).toHaveLength(3)
  expect(statements[1]).toContain('PERFORM 1; END')
  expect(() => sqlStatements("SELECT 'unterminated")).toThrow('Unterminated')
})
