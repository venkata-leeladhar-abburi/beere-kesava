// Real accountant/staff attribution when the record has it; "—" for record
// types that don't carry an actor, rather than falsely attributing every
// entry to "Admin".
export function formatRecordedBy(actor?: { firstName: string; lastName: string } | null): string {
  return actor ? `${actor.firstName} ${actor.lastName}`.trim() : "—";
}
