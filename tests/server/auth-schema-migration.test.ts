import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const migration = readFileSync('drizzle/0001_auth_tables.sql', 'utf8')

describe('Better Auth migration contract', () => {
  it('contains the required tables, admin role, and relational boundaries', () => {
    expect(migration).toMatch(/CREATE TABLE "user"/)
    expect(migration).toMatch(/CREATE TABLE "session"/)
    expect(migration).toMatch(/CREATE TABLE "account"/)
    expect(migration).toMatch(/CREATE TABLE "verification"/)
    expect(migration).toMatch(/"role" text NOT NULL DEFAULT 'admin'/)
    expect(migration).toMatch(/REFERENCES "user"\("id"\) ON DELETE CASCADE/)
    expect(migration).toMatch(/CREATE UNIQUE INDEX "user_email_idx"/)
    expect(migration).toMatch(/CREATE INDEX "session_user_idx"/)
  })
})
