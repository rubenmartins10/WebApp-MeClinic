let _ctx = null;
const getCtx = () => {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  return _ctx;
};

// helper: play a single sine tone with attack/decay envelope
const tone = (ctx, freq, startTime, volume, attack, decay, type = 'sine') => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.type = type; osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + attack);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + attack + decay);
  osc.start(startTime); osc.stop(startTime + attack + decay);
};

const SOUNDS = {
  // 1
  plim: (ctx) => {
    const t0 = ctx.currentTime;
    const bell = ctx.createOscillator(); const bellGain = ctx.createGain();
    bell.connect(bellGain); bellGain.connect(ctx.destination);
    bell.type = 'sine';
    bell.frequency.setValueAtTime(1318.5, t0);
    bell.frequency.exponentialRampToValueAtTime(1280, t0 + 0.6);
    bellGain.gain.setValueAtTime(0, t0);
    bellGain.gain.linearRampToValueAtTime(0.4, t0 + 0.008);
    bellGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.9);
    bell.start(t0); bell.stop(t0 + 0.9);
    tone(ctx, 2637, t0, 0.1, 0.008, 0.34);
  },

  // 2
  duplo: (ctx) => {
    [[1046, 0], [1318.5, 0.22]].forEach(([freq, delay]) => {
      const t = ctx.currentTime + delay;
      tone(ctx, freq, t, 0.35, 0.008, 0.64);
      tone(ctx, freq * 2, t, 0.08, 0.008, 0.27);
    });
  },

  // 3
  suave: (ctx) => {
    tone(ctx, 784, ctx.currentTime, 0.28, 0.06, 1.54);
  },

  // 4
  digital: (ctx) => {
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'square'; osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.12, t0);
    gain.gain.setValueAtTime(0, t0 + 0.07);
    gain.gain.setValueAtTime(0.12, t0 + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.26);
    osc.start(t0); osc.stop(t0 + 0.26);
  },

  // 5
  cristal: (ctx) => {
    const t0 = ctx.currentTime;
    tone(ctx, 2093, t0, 0.3, 0.004, 0.50);
    tone(ctx, 2637, t0 + 0.06, 0.18, 0.004, 0.42);
  },

  // 6
  pop: (ctx) => {
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t0);
    osc.frequency.exponentialRampToValueAtTime(200, t0 + 0.08);
    gain.gain.setValueAtTime(0.5, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.12);
    osc.start(t0); osc.stop(t0 + 0.12);
  },

  // 7
  carrilhao: (ctx) => {
    [0, 0.18, 0.36].forEach((delay, i) => {
      const freqs = [1047, 1319, 1568];
      tone(ctx, freqs[i], ctx.currentTime + delay, 0.28, 0.006, 0.55);
    });
  },

  // 8
  alerta: (ctx) => {
    const t0 = ctx.currentTime;
    tone(ctx, 1760, t0, 0.3, 0.004, 0.12, 'square');
    tone(ctx, 1760, t0 + 0.18, 0.3, 0.004, 0.12, 'square');
  },

  // 9
  piano: (ctx) => {
    const t0 = ctx.currentTime;
    // simulate piano with sine + detuned sine
    tone(ctx, 523.25, t0, 0.4, 0.003, 1.2);
    tone(ctx, 524.5,  t0, 0.1, 0.003, 0.8); // slight detune for richness
    tone(ctx, 1046.5, t0, 0.08, 0.003, 0.4);
  },

  // 10
  harpa: (ctx) => {
    [0, 0.10, 0.20, 0.30].forEach((delay, i) => {
      const freqs = [523, 659, 784, 1047];
      tone(ctx, freqs[i], ctx.currentTime + delay, 0.22, 0.004, 0.9);
    });
  },

  // 11
  gong: (ctx) => {
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, t0);
    osc.frequency.exponentialRampToValueAtTime(85, t0 + 2.0);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(0.5, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 2.2);
    osc.start(t0); osc.stop(t0 + 2.2);
    tone(ctx, 220, t0, 0.15, 0.015, 1.2);
  },

  // 12
  flauta: (ctx) => {
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t0);
    osc.frequency.linearRampToValueAtTime(932, t0 + 0.15);
    osc.frequency.linearRampToValueAtTime(880, t0 + 0.4);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(0.3, t0 + 0.06);
    gain.gain.setValueAtTime(0.3, t0 + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.7);
    osc.start(t0); osc.stop(t0 + 0.7);
  },

  // 13
  pulso: (ctx) => {
    [0, 0.25, 0.5].forEach(delay => {
      tone(ctx, 1000, ctx.currentTime + delay, 0.2, 0.004, 0.18, 'sine');
    });
  },

  // 14
  eco: (ctx) => {
    [0, 0.3, 0.6].forEach((delay, i) => {
      tone(ctx, 1047, ctx.currentTime + delay, 0.35 / (i + 1), 0.005, 0.5);
    });
  },

  // 15
  ascendente: (ctx) => {
    [523, 659, 784, 1047].forEach((freq, i) => {
      tone(ctx, freq, ctx.currentTime + i * 0.12, 0.28, 0.005, 0.35);
    });
  },

  // 16
  descendente: (ctx) => {
    [1047, 784, 659, 523].forEach((freq, i) => {
      tone(ctx, freq, ctx.currentTime + i * 0.12, 0.28, 0.005, 0.35);
    });
  },

  // 17
  marimba: (ctx) => {
    const t0 = ctx.currentTime;
    tone(ctx, 880, t0, 0.35, 0.003, 0.7);
    tone(ctx, 1760, t0, 0.1, 0.003, 0.25);
    tone(ctx, 880, t0 + 0.22, 0.25, 0.003, 0.55);
  },

  // 18
  veludo: (ctx) => {
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine'; osc.frequency.value = 392;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(0.25, t0 + 0.12);
    gain.gain.setValueAtTime(0.25, t0 + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 1.4);
    osc.start(t0); osc.stop(t0 + 1.4);
    tone(ctx, 784, t0 + 0.12, 0.08, 0.05, 0.9);
  },

  // 19
  zen: (ctx) => {
    const t0 = ctx.currentTime;
    tone(ctx, 432, t0, 0.3, 0.1, 2.0);
    tone(ctx, 648, t0 + 0.5, 0.15, 0.1, 1.5);
  },

  // 20
  sintetizador: (ctx) => {
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sawtooth'; osc.frequency.value = 440;
    // lowpass filter for warmth
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 900;
    osc.disconnect(); osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(0.18, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.5);
    osc.start(t0); osc.stop(t0 + 0.5);
  },

  // 21
  triplo: (ctx) => {
    [0, 0.15, 0.30].forEach(delay => {
      tone(ctx, 1318.5, ctx.currentTime + delay, 0.28, 0.005, 0.35);
      tone(ctx, 2637, ctx.currentTime + delay, 0.07, 0.005, 0.2);
    });
  },

  // 22
  agua: (ctx) => {
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, t0);
    osc.frequency.exponentialRampToValueAtTime(900, t0 + 0.08);
    osc.frequency.exponentialRampToValueAtTime(700, t0 + 0.18);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(0.32, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.38);
    osc.start(t0); osc.stop(t0 + 0.38);
  },

  // 23
  corda: (ctx) => {
    const t0 = ctx.currentTime;
    // plucked string simulation
    tone(ctx, 293.66, t0, 0.4, 0.002, 1.4);
    tone(ctx, 587.33, t0, 0.15, 0.002, 0.7);
    tone(ctx, 880,    t0, 0.05, 0.002, 0.35);
  },
};

export const SOUND_OPTIONS = [
  { id: 'plim',         label: 'Plim',         desc: 'Sino clássico',    Icon: 'Bell'      },
  { id: 'duplo',        label: 'Duplo',         desc: 'Dois tons',        Icon: 'Music'     },
  { id: 'suave',        label: 'Suave',         desc: 'Tom suave',        Icon: 'Wind'      },
  { id: 'digital',      label: 'Digital',       desc: 'Bip digital',      Icon: 'Zap'       },
  { id: 'cristal',      label: 'Cristal',       desc: 'Tom cristalino',   Icon: 'Sparkles'  },
  { id: 'pop',          label: 'Pop',           desc: 'Estalo suave',     Icon: 'Circle'    },
  { id: 'carrilhao',    label: 'Carrilhão',     desc: 'Três notas',       Icon: 'Music2'    },
  { id: 'alerta',       label: 'Alerta',        desc: 'Duble beep',       Icon: 'AlertCircle'},
  { id: 'piano',        label: 'Piano',         desc: 'Nota de piano',    Icon: 'Key'       },
  { id: 'harpa',        label: 'Harpa',         desc: 'Arpejo suave',     Icon: 'Waves'     },
  { id: 'gong',         label: 'Gong',          desc: 'Ressonância grave', Icon: 'Disc'     },
  { id: 'flauta',       label: 'Flauta',        desc: 'Tom de flauta',    Icon: 'Airplay'   },
  { id: 'pulso',        label: 'Pulso',         desc: 'Três pulsos',      Icon: 'Activity'  },
  { id: 'eco',          label: 'Eco',           desc: 'Efeito de eco',    Icon: 'Repeat'    },
  { id: 'ascendente',   label: 'Ascendente',    desc: 'Escala a subir',   Icon: 'TrendingUp'},
  { id: 'descendente',  label: 'Descendente',   desc: 'Escala a descer',  Icon: 'TrendingDown'},
  { id: 'marimba',      label: 'Marimba',       desc: 'Som de marimba',   Icon: 'BarChart2' },
  { id: 'veludo',       label: 'Veludo',        desc: 'Tom quente',       Icon: 'Feather'   },
  { id: 'zen',          label: 'Zen',           desc: 'Tom meditativo',   Icon: 'Sunset'    },
  { id: 'sintetizador', label: 'Sintetizador',  desc: 'Som sintético',    Icon: 'Sliders'   },
  { id: 'triplo',       label: 'Triplo',        desc: 'Três plims',       Icon: 'Star'      },
  { id: 'agua',         label: 'Água',          desc: 'Gota de água',     Icon: 'Droplets'  },
  { id: 'corda',        label: 'Corda',         desc: 'Corda dedilhada',  Icon: 'Guitar'    },
];

export function playNotificationSound(soundId) {
  const id = soundId || localStorage.getItem('meclinic_notification_sound') || 'plim';
  try {
    const ctx = getCtx();
    const fn = SOUNDS[id] || SOUNDS.plim;
    fn(ctx);
  } catch {
    // Web Audio not available — fail silently
  }
}

