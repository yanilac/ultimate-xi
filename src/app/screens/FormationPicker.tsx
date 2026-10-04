import { FORMATIONS, type Formation } from "../../engine";

export function MiniPitch({ formation }: { formation: Formation }) {
  return (
    <svg viewBox="0 0 100 120" className="mini-pitch" aria-hidden>
      <rect x="1" y="1" width="98" height="118" rx="6" className="mini-pitch__grass" />
      {formation.slots.map((s, i) => (
        <circle key={i} cx={s.x} cy={115 - s.y * 1.08} r="5.5" className="mini-pitch__dot" />
      ))}
    </svg>
  );
}

export function FormationPicker({ onPick, onBack }: { onPick: (name: string) => void; onBack: () => void }) {
  return (
    <main className="screen">
      <header className="topbar">
        <button className="btn btn--ghost btn--small" onClick={onBack}>Back</button>
        <h2>Pick a formation</h2>
        <span />
      </header>
      <div className="formations">
        {FORMATIONS.map((f) => (
          <button key={f.name} className="formation" onClick={() => onPick(f.name)}>
            <MiniPitch formation={f} />
            <span className="formation__name">{f.name}</span>
          </button>
        ))}
      </div>
    </main>
  );
}
