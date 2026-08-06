// Mock ACTION_ENTRIES / LOGIN_ENTRIES data have been removed — both the
// action feed (ActionLogSection) and login history (LoginHistorySection)
// now render live data from the backend via shared/api/audit-log.ts.
// LoginEvent stays here since it's the shared shape both the API mapper
// and LoginHistorySection's UI code depend on.
export type LoginEvent = { id: number | string; status: "login"|"logout"|"failed"; user: string; role: string; time: string; device: string; duration: string | null; failReason?: string };
