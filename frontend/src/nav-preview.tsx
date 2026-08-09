/**
 * DEV-ONLY nav preview harness — NOT part of the app bundle.
 * ═══════════════════════════════════════════════════════════════════════════
 * Reached at /nav-preview.html on the dev server. Mounts the real TopNav
 * (admin) or SATopNav (superadmin) with representative props and no
 * auth/OTP, since login has been an unreliable way to see rendered UI in
 * this project. Same technique as doc-preview.tsx.
 */
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router";
import "./styles/index.css";
import { AuthContext } from "./contexts/AuthContext";
import { TopNav } from "./features/dashboards/components/beere-dashboard/components/TopNav";
import { SATopNav } from "./features/dashboards/components/superadmin-dashboard/SATopNav";

const fakeAuth = {
  isAuthenticated: true, role: "admin" as const, phone: "8888888888", token: "dev",
  user: { id: "dev", name: "Preview Admin", email: "", mobile: "", role: "admin", accessLevel: undefined },
  login: () => {}, selectRole: () => {}, logout: () => {}, adminViewingAs: null, clearAdminView: () => {},
};

const WHICH = new URLSearchParams(location.search).get("which") ?? "admin";
const ACTIVE = new URLSearchParams(location.search).get("active") ?? "Materials";

function App() {
  return (
    <MemoryRouter>
      <AuthContext.Provider value={fakeAuth}>
        <div style={{ minHeight: "100dvh", background: "#F7F3EE" }}>
          {WHICH === "sa" ? (
            <SATopNav active={ACTIVE} set={() => {}} onProfile={() => {}} />
          ) : (
            <TopNav active={ACTIVE} set={() => {}} onLogout={() => {}} onProfile={() => {}} />
          )}
          <div style={{ padding: 48 }}>
            <p style={{ fontFamily: "sans-serif", color: "#999" }}>
              Preview harness — nav only. Try ?which=sa for superadmin, ?active=Finance to open a different group.
            </p>
          </div>
        </div>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

const container = document.getElementById("root")! as HTMLElement & { _root?: ReturnType<typeof createRoot> };
container._root ??= createRoot(container);
container._root.render(<App />);
