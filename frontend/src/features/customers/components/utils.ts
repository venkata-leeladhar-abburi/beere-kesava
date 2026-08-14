// ── Shared helpers ───────────────────────────────────────────────────────────

// Sale/visit dates in this data are a mix of real dates ("15 May 2026") and
// relative labels ("6 months ago", "Today", "Yesterday") — this normalizes
// either form into an approximate "months since" number so sort/filter/timeline
// controls can work across both without re-authoring the demo data.
export function monthsSinceLabel(label: string | undefined | null): number {
  if (!label) return 999;
  const s = label.trim().toLowerCase();
  if (s === "today") return 0;
  if (s === "yesterday") return 0;
  const monthsMatch = s.match(/(\d+)\s*month/);
  if (monthsMatch) return parseInt(monthsMatch[1], 10);
  const daysMatch = s.match(/(\d+)\s*day/);
  if (daysMatch) return parseInt(daysMatch[1], 10) / 30;
  const weeksMatch = s.match(/(\d+)\s*week/);
  if (weeksMatch) return (parseInt(weeksMatch[1], 10) * 7) / 30;
  const d = new Date(label);
  if (!isNaN(d.getTime())) {
    const diffMs = Date.now() - d.getTime();
    return Math.max(0, diffMs / (1000 * 60 * 60 * 24 * 30));
  }
  return 999;
}

export function downloadCustomerCSV(customerName: string, fields: [string, string | undefined][]) {
  const rows = fields.filter(([, value]) => !!value) as [string, string][];
  const csvString = rows.map(([label, value]) => `"${label}","${String(value).replace(/"/g, '""')}"`).join("\n");
  const blob = new Blob([csvString], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${customerName}_data.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadDataAsCSV(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const csvContent = [
    headers.map(h => `"${h.replace(/"/g, '""')}"`).join(","),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
