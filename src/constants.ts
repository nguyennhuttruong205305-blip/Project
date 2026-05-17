export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const VI_NOTES: Record<string, string> = {
  C: 'Đô',
  'C#': 'Đô#',
  D: 'Rê',
  'D#': 'Rê#',
  E: 'Mi',
  F: 'Fa',
  'F#': 'Fa#',
  G: 'Sol',
  'G#': 'Sol#',
  A: 'La',
  'A#': 'La#',
  B: 'Si',
};

export const SCALES = [
  { en: 'Major', vi: 'Trưởng' },
  { en: 'Minor', vi: 'Thứ' },
];

export const LNAMES = ['LOOP 1', 'LOOP 2', 'LOOP 3', 'LOOP 4', 'VERSE', 'CHORUS', 'BRIDGE', 'OUTRO'];

export const CH_NAMES = ['VOCAL', 'NHẠC', 'VANG', 'DRUM', 'BASS', 'FX'];
export const CH_COL = ['#ff6644', '#3399ff', '#cc44ff', '#ffaa00', '#44ffaa', '#ff44aa'];

export const CMD_MAP: Record<string, string> = {
  rewind: '⏮ Về đầu',
  stop: '⏹ Dừng',
  loop: '🔁 Loop on/off',
  click: '🎵 Click track',
  open: '📁 Mở project',
  save: '💾 Lưu project',
  export: '📤 Xuất audio',
  add_track: '➕ Thêm track',
  mixer: '🎛 Mở Mixer (F3)',
  vsti: '🎹 VST Instruments (F11)',
  inserts: '🔌 Insert FX (F4)',
  undo: '↩ Hoàn tác',
  redo: '↪ Làm lại',
  quantize: '⌛ Quantize',
  freeze: '❄ Freeze track',
  bounce: '🔀 Bounce',
  play: '▶ Phát',
  record: '⏺ Thu âm',
};

export const CMD_PC: Record<string, number> = {
  save: 0,
  export: 1,
  add_track: 2,
  mixer: 3,
  vsti: 4,
  inserts: 5,
  undo: 6,
  redo: 7,
  quantize: 8,
  freeze: 9,
  bounce: 10,
  rewind: 11,
  stop: 12,
  play: 13,
  record: 14,
  loop: 15,
};
