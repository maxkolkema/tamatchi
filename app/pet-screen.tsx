"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Needs = { hunger: number; affection: number; energy: number; boredom: number; cleanliness: number };
type Reaction = "" | "pet-happy" | "pet-bratty" | "angy" | "feed" | "feed-offer" | "play" | "clean" | "clean-refused" | "tired";
type State = { needs: Needs; reaction: Reaction; lastUpdated: number };
type Settings = { godMode: boolean };
const initial: State = { needs: { hunger: 20, affection: 60, energy: 85, boredom: 15, cleanliness: 90 }, reaction: "", lastUpdated: Date.now() };
const initialSettings: Settings = { godMode: false };
const idleClips = ["idle_blink", "idle_ear_twitch", "idle_head_tilt", "idle_look_left", "idle_look_right", "idle_groom"];
const scenes = ["scene_japan", "scene_hogwarts", "scene_sf", "scene_texas"] as const;

function clamp(value: number) { return Math.max(0, Math.min(100, value)); }
function progress(state: State, now: number, godMode: boolean): State {
  if (godMode) return { ...state, lastUpdated: now };
  const hours = Math.min(12, Math.max(0, now - state.lastUpdated) / 3_600_000);
  return { ...state, needs: { hunger: clamp(state.needs.hunger + 12.5 * hours), affection: clamp(state.needs.affection - 2 * hours), energy: clamp(state.needs.energy - 7 * hours), boredom: clamp(state.needs.boredom + 16 * hours), cleanliness: clamp(state.needs.cleanliness - 4 * hours) }, lastUpdated: now };
}

function PixelHeart({ className = "" }: { className?: string }) { return <svg className={className} viewBox="0 0 18 16" aria-hidden="true" shapeRendering="crispEdges"><path fill="currentColor" d="M2 0h4v2h2V0h4v2h2v6h-2v2h-2v2H8v2H6v-2H4v-2H2V8H0V2h2z" /></svg>; }
function PixelFish({ className = "" }: { className?: string }) { return <svg className={className} viewBox="0 0 24 14" aria-hidden="true" shapeRendering="crispEdges"><path fill="currentColor" d="M5 2h11v2h3V2h3v10h-3v-2h-3v2H5v-2H2V8H0V6h2V4h3z" /><rect x="7" y="4" width="2" height="2" fill="#dff7ff" /></svg>; }
function PixelAnger({ className = "" }: { className?: string }) { return <svg className={className} viewBox="0 0 20 20" aria-hidden="true" shapeRendering="crispEdges"><path fill="currentColor" d="M0 0h4v3h3v3h6V3h3V0h4v4h-3v3h-3v6h3v3h3v4h-4v-3h-3v-3H7v3H4v3H0v-4h3v-3h3V7H3V4H0z" /></svg>; }
function PixelBang({ className = "" }: { className?: string }) { return <svg className={className} viewBox="0 0 8 18" aria-hidden="true" shapeRendering="crispEdges"><path fill="currentColor" d="M2 0h4v11H2zM2 14h4v4H2z" /></svg>; }
function PixelQuestion({ className = "" }: { className?: string }) { return <svg className={className} viewBox="0 0 12 18" aria-hidden="true" shapeRendering="crispEdges"><path fill="currentColor" d="M2 0h8v2h2v6h-2v2H8v2H4V8h4V4H4v2H0V2h2zM4 14h4v4H4z" /></svg>; }
function PixelBubbles({ className = "" }: { className?: string }) { return <span className={`pixel-bubbles ${className}`} aria-hidden="true"><i /><i /><i /></span>; }
function PixelToy({ className = "" }: { className?: string }) { return <span className={`pixel-toy ${className}`} aria-hidden="true"><i className="toy-string" /><i className="toy-feather" /></span>; }

function EffectLayer({ reaction, token }: { reaction: Reaction; token: number }) {
  if (!reaction) return null;
  if (reaction === "pet-happy") return <div className="effect-layer hearts-effect" key={token}><PixelHeart /><PixelHeart /></div>;
  if (reaction === "pet-bratty") return <div className="effect-layer bratty-effect" key={token}><PixelQuestion /></div>;
  if (reaction === "angy") return <div className="effect-layer anger-effect" key={token}><PixelAnger /></div>;
  if (reaction === "feed") return <div className="effect-layer eating-effect" key={token}><PixelFish /></div>;
  if (reaction === "feed-offer") return <div className="effect-layer offer-effect" key={token}><PixelFish /></div>;
  if (reaction === "clean-refused") return <div className="effect-layer bratty-effect" key={token}><PixelQuestion /></div>;
  if (reaction === "play") return <div className="effect-layer play-effect" key={token}><PixelBang /><PixelToy /></div>;
  if (reaction === "clean") return <div className="effect-layer clean-effect" key={token}><PixelBubbles /></div>;
  return <div className="effect-layer tired-effect" key={token}><span>Z</span><span>Z</span><span>Z</span></div>;
}

function IdleCue({ needs, sleeping }: { needs: Needs; sleeping: boolean }) {
  if (sleeping) return <div className="idle-cue sleep-cue" aria-hidden="true"><i>Z</i><i>Z</i><i>Z</i></div>;
  if (needs.cleanliness <= 30) return <div className="idle-cue stink-cue" aria-hidden="true"><i /><i /><i /><i /></div>;
  if (needs.hunger >= 60) return <div className="idle-cue fish-cue" aria-hidden="true"><PixelFish /></div>;
  if (needs.boredom >= 70) return <div className="idle-cue thought-cue" aria-hidden="true"><i /><i /><i /></div>;
  return null;
}

export default function PetScreen() {
  const [pet, setPet] = useState<State>(initial);
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [statsOpen, setStatsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [scene, setScene] = useState<(typeof scenes)[number]>("scene_japan");
  const [idleClipIndex, setIdleClipIndex] = useState(0);
  const [frame, setFrame] = useState(0);
  const [reactionToken, setReactionToken] = useState(0);
  const petTimes = useRef<number[]>([]);
  const needs = pet.needs;
  const sleeping = needs.energy <= 10 && !pet.reaction;
  const clip = sleeping ? "sleeping" : pet.reaction === "angy" ? "mood_angy" : pet.reaction === "pet-bratty" || pet.reaction === "feed-offer" ? "idle_look_left" : pet.reaction === "play" ? "idle_look_right" : pet.reaction === "clean" || pet.reaction === "feed" ? "idle_groom" : needs.boredom >= 70 ? "mood_bored" : idleClips[idleClipIndex];
  const petSource = `/pet-sheets/${clip}.png`;
  const framePosition = clip === "sleeping" ? 0 : frame * 12.5;

  useEffect(() => {
    const savedSettings = window.localStorage.getItem("tamatchi.settings");
    const nextSettings = savedSettings ? { ...initialSettings, ...(JSON.parse(savedSettings) as Settings) } : initialSettings;
    setSettings(nextSettings);
    const savedPet = window.localStorage.getItem("tamatchi.pet");
    if (savedPet) setPet(progress(JSON.parse(savedPet) as State, Date.now(), nextSettings.godMode));
    const savedScene = window.localStorage.getItem("tamatchi.scene") as (typeof scenes)[number] | null;
    if (savedScene && scenes.includes(savedScene)) setScene(savedScene);
    const idleTimer = window.setInterval(() => setIdleClipIndex((current) => (current + 1) % idleClips.length), 5200);
    return () => window.clearInterval(idleTimer);
  }, []);
  useEffect(() => { const timer = window.setInterval(() => setPet((current) => progress(current, Date.now(), settings.godMode)), 1000); return () => window.clearInterval(timer); }, [settings.godMode]);
  useEffect(() => {
    setFrame(0);
    if (clip === "sleeping") return;
    const timer = window.setInterval(() => setFrame((current) => (current + 1) % 9), 130);
    return () => window.clearInterval(timer);
  }, [clip]);
  useEffect(() => { window.localStorage.setItem("tamatchi.pet", JSON.stringify(pet)); }, [pet]);
  useEffect(() => { window.localStorage.setItem("tamatchi.settings", JSON.stringify(settings)); }, [settings]);
  useEffect(() => { window.localStorage.setItem("tamatchi.scene", scene); }, [scene]);
  useEffect(() => { if (!pet.reaction) return; const timer = window.setTimeout(() => setPet((current) => ({ ...current, reaction: "" })), 2400); return () => window.clearTimeout(timer); }, [pet.reaction, reactionToken]);

  const status = useMemo(() => {
    const words: Record<Reaction, string> = { "": "TAP MATCHI TO PET", "pet-happy": "PURR...", "pet-bratty": "HMPH.", angy: "HEY! ENOUGH.", feed: "NOM NOM", "feed-offer": "NOT HUNGRY.", play: "PLAY TIME!", clean: "SQUEAKY CLEAN.", "clean-refused": "I'M ALREADY CLEAN.", tired: "EEPY..." };
    if (pet.reaction) return words[pet.reaction];
    if (sleeping) return "EEPY TIME...";
    if (settings.godMode) return "GOD MODE • MATCHI IS THRIVING";
    if (needs.cleanliness <= 30) return "I NEED A BATH";
    if (needs.hunger >= 60) return "I AM HUNGRY";
    if (needs.boredom >= 70) return "I'M BORED...";
    return words[""];
  }, [needs, pet.reaction, settings.godMode, sleeping]);
  const motionClass = pet.reaction === "angy" ? "angy" : pet.reaction === "play" ? "play" : pet.reaction === "clean" || pet.reaction === "feed" ? "groom" : needs.boredom >= 70 ? "bored" : "idle";

  function update(action: "pet" | "feed" | "play" | "clean") {
    const now = Date.now(); setReactionToken((current) => current + 1);
    setPet((current) => {
      const next = progress(current, now, settings.godMode); const n = { ...next.needs };
      let reaction: Reaction = action === "pet" ? "pet-happy" : action;
      if (action === "pet") {
        petTimes.current = petTimes.current.filter((time) => now - time <= 4500); petTimes.current.push(now);
        const angryWeight = petTimes.current.length >= 3 ? 55 : n.hunger >= 85 ? 45 : n.hunger >= 60 ? 25 : 10;
        const roll = Math.random() * 100; reaction = roll < angryWeight ? "angy" : roll < angryWeight + 20 ? "pet-bratty" : "pet-happy";
        if (reaction !== "angy") { n.affection += reaction === "pet-happy" ? 6 : 3; n.boredom -= 10; }
      }
      if (action === "feed") { if (n.hunger < 15 && !settings.godMode) reaction = "feed-offer"; else { n.hunger -= 45; n.affection += 3; } }
      if (action === "play") { if (n.energy < 15 && !settings.godMode) reaction = "tired"; else { n.boredom -= 35; n.energy -= 8; n.affection += 4; } }
      if (action === "clean") { if (n.cleanliness > 80 && !settings.godMode) reaction = "clean-refused"; else n.cleanliness += 70; }
      return { needs: Object.fromEntries(Object.entries(n).map(([key, value]) => [key, clamp(value)])) as Needs, reaction, lastUpdated: now };
    });
  }
  function toggleGodMode() { setSettings((current) => ({ ...current, godMode: !current.godMode })); setPet((current) => ({ ...current, lastUpdated: Date.now(), reaction: "" })); }
  function resetPet() { petTimes.current = []; setPet({ ...initial, lastUpdated: Date.now() }); setStatsOpen(false); setSettingsOpen(false); }

  return <main className="shell">
    <header><span className="wordmark">TAMATCHI</span><div className="header-actions"><button className="stats-button" type="button" onClick={() => setStatsOpen((open) => !open)}>{statsOpen ? "HIDE" : "STATS"}</button><button className="settings-button" type="button" aria-label="Open settings" onClick={() => setSettingsOpen(true)}>⚙</button></div></header>
    <button className={`pet-card ${sleeping ? "is-sleeping" : ""}`} type="button" aria-label="Pet Tamatchi" onClick={() => update("pet")}><img className="scene-background" src={`/animations/${scene}.gif`} alt="" aria-hidden="true" /><span className="scene-shade" aria-hidden="true" /><span key={petSource} className={`pet-animation pet-${motionClass}`} style={{ backgroundImage: `url(${petSource})`, backgroundPosition: `center ${framePosition}%` }} aria-label="Matchi the Tamatchi" /><IdleCue needs={needs} sleeping={sleeping} /><EffectLayer reaction={pet.reaction} token={reactionToken} />{settings.godMode && <span className="god-badge">GOD MODE</span>}<span className="pet-prompt">tap to pet</span></button>
    <p className="status" aria-live="polite">{status}</p>
    <nav className="actions" aria-label="Pet actions"><button type="button" onClick={() => update("pet")}><PixelHeart />PET</button><button type="button" onClick={() => update("feed")}><PixelFish />FEED</button><button type="button" onClick={() => update("play")}><PixelToy />PLAY</button><button type="button" onClick={() => update("clean")}><PixelBubbles />CLEAN</button></nav>
    <div className="scene-picker" aria-label="Choose a scene">{scenes.map((option) => <button type="button" className={scene === option ? "selected" : ""} aria-pressed={scene === option} key={option} onClick={() => setScene(option)}>{option.replace("scene_", "").toUpperCase()}</button>)}</div>
    {statsOpen && <section className="needs" aria-label="Matchi's needs">{(["hunger", "affection", "energy", "boredom", "cleanliness"] as const).map((key) => <label key={key}><span>{key}</span><meter min="0" max="100" value={key === "hunger" || key === "boredom" ? 100 - needs[key] : needs[key]} /></label>)}</section>}
    {settingsOpen && <div className="dialog-backdrop" role="presentation" onClick={() => setSettingsOpen(false)}><section className="settings-panel" role="dialog" aria-modal="true" aria-label="Settings" onClick={(event) => event.stopPropagation()}><div className="settings-heading"><h2>SETTINGS</h2><button type="button" aria-label="Close settings" onClick={() => setSettingsOpen(false)}>×</button></div><label className="toggle-row"><span><strong>GOD MODE</strong><small>Needs stay frozen and every action works.</small></span><input type="checkbox" checked={settings.godMode} onChange={toggleGodMode} /></label><button className="reset-button" type="button" onClick={resetPet}>RESET MATCHI</button></section></div>}
    <p className="hint">In Safari, Share → Add to Home Screen to use Tamatchi like an app.</p><script dangerouslySetInnerHTML={{ __html: "if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');" }} />
  </main>;
}
