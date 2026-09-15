"use client";

import { useEffect, useMemo, useState } from "react";

type Needs = { hunger: number; affection: number; energy: number; boredom: number; cleanliness: number };
type State = { needs: Needs; reaction: string; lastUpdated: number };
const initial: State = { needs: { hunger: 20, affection: 60, energy: 85, boredom: 15, cleanliness: 90 }, reaction: "", lastUpdated: Date.now() };

function clamp(value: number) { return Math.max(0, Math.min(100, value)); }
function progress(state: State, now: number): State {
  const hours = Math.min(12, Math.max(0, now - state.lastUpdated) / 3_600_000);
  return { ...state, needs: {
    hunger: clamp(state.needs.hunger + 12.5 * hours),
    affection: clamp(state.needs.affection - 2 * hours),
    energy: clamp(state.needs.energy - 7 * hours),
    boredom: clamp(state.needs.boredom + 16 * hours),
    cleanliness: clamp(state.needs.cleanliness - 4 * hours),
  }, lastUpdated: now };
}

export default function PetScreen() {
  const [pet, setPet] = useState<State>(initial);
  const [statsOpen, setStatsOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("tamatchi.pet");
    if (stored) setPet(progress(JSON.parse(stored) as State, Date.now()));
    const timer = window.setInterval(() => setPet((current) => progress(current, Date.now())), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => { window.localStorage.setItem("tamatchi.pet", JSON.stringify(pet)); }, [pet]);

  const needs = pet.needs;
  const status = useMemo(() => {
    if (pet.reaction) return pet.reaction.toUpperCase();
    if (needs.cleanliness <= 30) return "I NEED A BATH";
    if (needs.hunger >= 60) return "I AM HUNGRY";
    if (needs.boredom >= 70) return "...";
    return "FLOOF IS HERE";
  }, [needs, pet.reaction]);

  function act(action: "pet" | "feed" | "play" | "clean") {
    setPet((current) => {
      const next = progress(current, Date.now());
      const n = { ...next.needs };
      let reaction = "";
      if (action === "pet") { n.affection += 6; n.boredom -= 10; reaction = n.hunger >= 85 ? "angy" : "affectionate"; }
      if (action === "feed") { if (n.hunger < 20) reaction = "refused"; else { n.hunger -= 45; n.affection += 3; reaction = "eating"; } }
      if (action === "play") { if (n.energy < 15) reaction = "too tired"; else { n.boredom -= 35; n.energy -= 8; n.affection += 4; reaction = "playing"; } }
      if (action === "clean") { if (n.cleanliness >= 90) reaction = "already clean"; else { n.cleanliness += 70; reaction = "cleaned"; } }
      return { needs: Object.fromEntries(Object.entries(n).map(([key, value]) => [key, clamp(value)])) as Needs, reaction, lastUpdated: Date.now() };
    });
  }

  return <main className="shell">
    <header><span className="wordmark">TAMATCHI</span><button className="stats-button" onClick={() => setStatsOpen(!statsOpen)}>{statsOpen ? "HIDE" : "STATS"}</button></header>
    <section className="pet-card" aria-label="Tamatchi pet">
      <img src="/animations/idle_blink.gif" alt="Tamatchi" />
      {needs.hunger >= 60 && <span className="thought">🐟</span>}
      {needs.boredom >= 70 && <span className="thought">…</span>}
      {needs.cleanliness <= 30 && <span className="stink">〰</span>}
    </section>
    <p className="status">{status}</p>
    <nav className="actions" aria-label="Pet actions">
      {(["pet", "feed", "play", "clean"] as const).map((action) => <button key={action} onClick={() => act(action)}>{action.toUpperCase()}</button>)}
    </nav>
    {statsOpen && <section className="needs">{(["hunger", "affection", "energy", "boredom", "cleanliness"] as const).map((key) => <label key={key}><span>{key}</span><meter min="0" max="100" value={needs[key]} /> </label>)}</section>}
    <p className="hint">Add Tamatchi to your Home Screen from Safari to use it like an app.</p>
    <script dangerouslySetInnerHTML={{ __html: `if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');` }} />
  </main>;
}
