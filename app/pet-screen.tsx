"use client";

import { useEffect, useMemo, useState } from "react";

type Needs = { hunger: number; affection: number; energy: number; boredom: number; cleanliness: number };
type Reaction = "" | "pet" | "feed" | "play" | "clean" | "angy" | "tired" | "refused";
type State = { needs: Needs; reaction: Reaction; lastUpdated: number };
type Settings = { godMode: boolean };

const initial: State = { needs: { hunger: 20, affection: 60, energy: 85, boredom: 15, cleanliness: 90 }, reaction: "", lastUpdated: Date.now() };
const initialSettings: Settings = { godMode: false };
const idleAnimations = ["idle_blink", "idle_ear_twitch", "idle_look_left", "idle_look_right", "idle_head_tilt", "idle_groom"];
const scenes = ["scene_japan", "scene_hogwarts", "scene_sf", "scene_texas"] as const;
const actionMeta = {
  pet: { label: "PET", icon: "♡" },
  feed: { label: "FEED", icon: "🐟" },
  play: { label: "PLAY", icon: "✦" },
  clean: { label: "CLEAN", icon: "✧" },
} as const;

function clamp(value: number) { return Math.max(0, Math.min(100, value)); }
function progress(state: State, now: number, godMode: boolean): State {
  if (godMode) return { ...state, lastUpdated: now };
  const hours = Math.min(12, Math.max(0, now - state.lastUpdated) / 3_600_000);
  return { ...state, needs: {
    hunger: clamp(state.needs.hunger + 12.5 * hours), affection: clamp(state.needs.affection - 2 * hours),
    energy: clamp(state.needs.energy - 7 * hours), boredom: clamp(state.needs.boredom + 16 * hours),
    cleanliness: clamp(state.needs.cleanliness - 4 * hours),
  }, lastUpdated: now };
}

export default function PetScreen() {
  const [pet, setPet] = useState<State>(initial);
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [statsOpen, setStatsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [scene, setScene] = useState<(typeof scenes)[number]>("scene_japan");
  const [idleIndex, setIdleIndex] = useState(0);

  useEffect(() => {
    const savedSettings = window.localStorage.getItem("tamatchi.settings");
    const nextSettings = savedSettings ? { ...initialSettings, ...JSON.parse(savedSettings) as Settings } : initialSettings;
    setSettings(nextSettings);
    const savedPet = window.localStorage.getItem("tamatchi.pet");
    if (savedPet) setPet(progress(JSON.parse(savedPet) as State, Date.now(), nextSettings.godMode));
    const savedScene = window.localStorage.getItem("tamatchi.scene") as (typeof scenes)[number] | null;
    if (savedScene && scenes.includes(savedScene)) setScene(savedScene);
    const idleTimer = window.setInterval(() => setIdleIndex((current) => (current + 1) % idleAnimations.length), 4500);
    return () => window.clearInterval(idleTimer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setPet((current) => progress(current, Date.now(), settings.godMode)), 1000);
    return () => window.clearInterval(timer);
  }, [settings.godMode]);

  useEffect(() => { window.localStorage.setItem("tamatchi.pet", JSON.stringify(pet)); }, [pet]);
  useEffect(() => { window.localStorage.setItem("tamatchi.settings", JSON.stringify(settings)); }, [settings]);
  useEffect(() => { window.localStorage.setItem("tamatchi.scene", scene); }, [scene]);
  useEffect(() => {
    if (!pet.reaction) return;
    const timer = window.setTimeout(() => setPet((current) => ({ ...current, reaction: "" })), 1800);
    return () => window.clearTimeout(timer);
  }, [pet.reaction]);

  const needs = pet.needs;
  const status = useMemo(() => {
    if (pet.reaction === "pet") return "PURR...";
    if (pet.reaction === "feed") return "NOM NOM";
    if (pet.reaction === "play") return "ZOOMIES!";
    if (pet.reaction === "clean") return "SPARKLY CLEAN";
    if (pet.reaction === "angy") return "FEED ME FIRST";
    if (pet.reaction === "tired") return "TOO SLEEPY";
    if (pet.reaction === "refused") return "I'M NOT HUNGRY";
    if (settings.godMode) return "GOD MODE • FLOOF IS THRIVING";
    if (needs.cleanliness <= 30) return "I NEED A BATH";
    if (needs.hunger >= 60) return "I AM HUNGRY";
    if (needs.boredom >= 70) return "I'M BORED...";
    return "TAP FLOOF TO PET";
  }, [needs, pet.reaction, settings.godMode]);

  const animation = pet.reaction === "angy" ? "mood_angy" : needs.boredom >= 70 ? "mood_bored" : pet.reaction === "clean" ? "idle_groom" : pet.reaction === "play" ? "idle_head_tilt" : idleAnimations[idleIndex];
  const effect = pet.reaction === "pet" ? "💗" : pet.reaction === "feed" ? "🐟" : pet.reaction === "play" ? "🧶" : pet.reaction === "clean" ? "🫧" : pet.reaction === "angy" ? "💢" : pet.reaction === "tired" ? "💤" : pet.reaction === "refused" ? "✕" : "";

  function act(action: keyof typeof actionMeta) {
    setPet((current) => {
      const next = progress(current, Date.now(), settings.godMode);
      const n = { ...next.needs };
      let reaction: Reaction = action;
      if (action === "pet") { n.affection += 9; n.boredom -= 8; if (n.hunger >= 85 && !settings.godMode) reaction = "angy"; }
      if (action === "feed") { if (n.hunger < 12 && !settings.godMode) reaction = "refused"; else { n.hunger -= 48; n.affection += 3; } }
      if (action === "play") { if (n.energy < 15 && !settings.godMode) reaction = "tired"; else { n.boredom -= 38; n.energy -= 8; n.affection += 5; } }
      if (action === "clean") n.cleanliness += 72;
      return { needs: Object.fromEntries(Object.entries(n).map(([key, value]) => [key, clamp(value)])) as Needs, reaction, lastUpdated: Date.now() };
    });
  }

  function toggleGodMode() {
    setSettings((current) => ({ ...current, godMode: !current.godMode }));
    setPet((current) => ({ ...current, lastUpdated: Date.now(), reaction: "" }));
  }
  function resetPet() { setPet({ ...initial, lastUpdated: Date.now() }); setStatsOpen(false); setSettingsOpen(false); }

  return <main className="shell">
    <header>
      <span className="wordmark">TAMATCHI</span>
      <div className="header-actions"><button className="stats-button" type="button" onClick={() => setStatsOpen((open) => !open)}>{statsOpen ? "HIDE" : "STATS"}</button><button className="settings-button" type="button" aria-label="Open settings" onClick={() => setSettingsOpen(true)}>⚙</button></div>
    </header>
    <button className="pet-card" type="button" aria-label="Pet Tamatchi" onClick={() => act("pet")}>
      <img className="scene-background" src={`/animations/${scene}.gif`} alt="" aria-hidden="true" />
      <span className="scene-shade" aria-hidden="true" />
      <img key={animation} className="pet-animation" src={`/animations/${animation}.gif`} alt="Floof the Tamatchi" />
      {effect && <span className="reaction-effect" aria-hidden="true">{effect}</span>}
      {needs.hunger >= 60 && !effect && <span className="need-effect" aria-hidden="true">🐟</span>}
      {needs.boredom >= 70 && !effect && <span className="need-effect" aria-hidden="true">…</span>}
      {needs.cleanliness <= 30 && !effect && <span className="need-effect" aria-hidden="true">🫧</span>}
      {settings.godMode && <span className="god-badge">✦ GOD MODE</span>}
      <span className="pet-prompt">tap to pet</span>
    </button>
    <p className="status" aria-live="polite">{status}</p>
    <nav className="actions" aria-label="Pet actions">
      {(Object.keys(actionMeta) as (keyof typeof actionMeta)[]).map((action) => <button type="button" key={action} onClick={() => act(action)}><span>{actionMeta[action].icon}</span>{actionMeta[action].label}</button>)}
    </nav>
    <div className="scene-picker" aria-label="Choose a scene">
      {scenes.map((option) => <button type="button" className={scene === option ? "selected" : ""} aria-pressed={scene === option} key={option} onClick={() => setScene(option)}>{option.replace("scene_", "").toUpperCase()}</button>)}
    </div>
    {statsOpen && <section className="needs" aria-label="Floof's needs">{(["hunger", "affection", "energy", "boredom", "cleanliness"] as const).map((key) => <label key={key}><span>{key}</span><meter min="0" max="100" value={key === "hunger" || key === "boredom" ? 100 - needs[key] : needs[key]} /></label>)}</section>}
    {settingsOpen && <div className="dialog-backdrop" role="presentation" onClick={() => setSettingsOpen(false)}><section className="settings-panel" role="dialog" aria-modal="true" aria-label="Settings" onClick={(event) => event.stopPropagation()}><div className="settings-heading"><h2>SETTINGS</h2><button type="button" aria-label="Close settings" onClick={() => setSettingsOpen(false)}>×</button></div><label className="toggle-row"><span><strong>GOD MODE</strong><small>Needs stay frozen and every action works.</small></span><input type="checkbox" checked={settings.godMode} onChange={toggleGodMode} /></label><button className="reset-button" type="button" onClick={resetPet}>RESET FLOOF</button></section></div>}
    <p className="hint">In Safari, Share → Add to Home Screen to use Tamatchi like an app.</p>
    <script dangerouslySetInnerHTML={{ __html: "if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');" }} />
  </main>;
}
