// Mock ACTION_ENTRIES / LOGIN_ENTRIES data have been removed — both the
// action feed (ActionLogSection) and login history (LoginHistorySection)
// now render live data from the backend via shared/api/audit-log.ts.
// LoginEvent stays here since it's the shared shape both the API mapper
// and LoginHistorySection's UI code depend on.
// `event` here is this audit log's own AuditEvent-shaped column, not a
// lifecycle status pill — matches lib/domain/status.ts's documented
// `AuditEvent` exception ("login"/"logout" belong in an audit event column,
// never a StatusPill). `AuditEvent` gained a "failed" member (this log's
// failed-login attempts) so the field can use the shared type directly
// instead of a local duplicate union.
import type { AuditEvent } from "@/lib/domain/status";

export type LoginEvent = { id: number | string; event: AuditEvent; user: string; role: string; time: string; device: string; duration: string | null; failReason?: string };
