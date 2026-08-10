// Mock ACTION_ENTRIES / LOGIN_ENTRIES data have been removed — both the
// action feed (ActionLogSection) and login history (LoginHistorySection)
// now render live data from the backend via shared/api/audit-log.ts.
// LoginEvent stays here since it's the shared shape both the API mapper
// and LoginHistorySection's UI code depend on.
// `status` here is this audit log's own AuditEvent-shaped column, not a
// lifecycle status pill — matches lib/domain/status.ts's documented
// `AuditEvent` exception ("login"/"logout" belong in an audit event column,
// never a StatusPill), except this log also tracks a failed-login attempt,
// which AuditEvent doesn't include. Left as a local literal union rather
// than importing AuditEvent (would drop "failed") or editing status.ts.
export type LoginEvent = { id: number | string; status: "login"|"logout"|"failed"; user: string; role: string; time: string; device: string; duration: string | null; failReason?: string };
