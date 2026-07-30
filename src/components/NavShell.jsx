import "./NavShell.css";

function NavShell({ pageTitle }) {
  return (
    <header className="nav-shell">
      <div className="nav-left">
        <span className="nav-logo">Voice-First Triage</span>
      </div>
      <div className="nav-right">
        <span className="nav-page-title">{pageTitle}</span>
      </div>
    </header>
  );
}

export default NavShell;