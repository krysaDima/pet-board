let audioContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new Ctx();
  }
  return audioContext;
}

/** Разблокировать аудио после жеста пользователя (политика браузера). */
export function warmupChatAudio(): void {
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    void ctx.resume();
  }
}

function prefersReducedSound(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Короткий «динь» — как в Chatty/Twitch (одна нота, быстрое затухание).
 */
function playDing(
  ctx: AudioContext,
  bus: GainNode,
  startTime: number,
  freq: number,
  peakGain: number,
): void {
  const t0 = startTime;
  const attack = 0.002;
  const decay = 0.11;

  const tone = ctx.createOscillator();
  const toneEnv = ctx.createGain();
  tone.type = 'sine';
  tone.frequency.setValueAtTime(freq, t0);

  const bell = ctx.createOscillator();
  const bellEnv = ctx.createGain();
  bell.type = 'sine';
  bell.frequency.setValueAtTime(freq * 2.76, t0);

  toneEnv.gain.setValueAtTime(0.0001, t0);
  toneEnv.gain.linearRampToValueAtTime(peakGain, t0 + attack);
  toneEnv.gain.exponentialRampToValueAtTime(0.0001, t0 + decay);

  bellEnv.gain.setValueAtTime(0.0001, t0);
  bellEnv.gain.linearRampToValueAtTime(peakGain * 0.14, t0 + attack);
  bellEnv.gain.exponentialRampToValueAtTime(0.0001, t0 + decay * 0.85);

  tone.connect(toneEnv);
  bell.connect(bellEnv);
  toneEnv.connect(bus);
  bellEnv.connect(bus);

  const stopAt = t0 + decay + 0.02;
  tone.start(t0);
  bell.start(t0);
  tone.stop(stopAt);
  bell.stop(stopAt);
}

/**
 * «Динь-дань» вниз — узнаваемый звук IRC/Twitch-чата (Chatty dingdong).
 */
export function playChatMessageSound(): void {
  if (prefersReducedSound()) return;

  const ctx = getContext();
  if (!ctx) return;

  const play = () => {
    const now = ctx.currentTime;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 3400;
    filter.Q.value = 0.4;

    const master = ctx.createGain();
    master.gain.value = 0.34;
    master.connect(filter);
    filter.connect(ctx.destination);

    // Высокая → ниже, ~80 ms между ударами (как dingdong в Chatty)
    playDing(ctx, master, now, 988, 1);
    playDing(ctx, master, now + 0.082, 740, 0.9);
  };

  if (ctx.state === 'suspended') {
    void ctx.resume().then(play).catch(() => {});
    return;
  }
  play();
}

/** Подписка на первый клик/тап для разблокировки звука. */
export function bindChatAudioWarmup(): void {
  if (typeof window === 'undefined') return;
  const warm = () => warmupChatAudio();
  window.addEventListener('pointerdown', warm, { once: true, passive: true });
  window.addEventListener('keydown', warm, { once: true });
}
