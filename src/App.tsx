import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, X, Plus, Minus, Settings as Gear, Play, Square, Circle, SkipBack, Repeat } from 'lucide-react';
import { useMidi } from './hooks/useMidi';
import { NOTES, VI_NOTES, SCALES, LNAMES, CH_NAMES, CH_COL, CMD_MAP, CMD_PC } from './constants';
import { Knob, ChannelFader } from './components/Controls';

type Tab = 'main' | 'midi' | 'cubase';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('main');
  const [status, setStatus] = useState('System Ready');
  const [logs, setLogs] = useState<{ type: string; msg: string; ts: string }[]>([]);
  const [curNote, setCurNote] = useState('C');
  const [curScale, setCurScale] = useState(SCALES[0]);
  const [bpm, setBpm] = useState(120);
  const [tcSec, setTcSec] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  // UI State
  const [showKeyPicker, setShowKeyPicker] = useState(false);
  const [showBpmPicker, setShowBpmPicker] = useState(false);
  const [loopStates, setLoopStates] = useState(Array(8).fill('idle'));
  const [vuLevels, setVuLevels] = useState(Array(6).fill(5));
  const [chFaderLevels, setChFaderLevels] = useState(Array(6).fill(75));

  const midi = useMidi();
  const [selectedIn, setSelectedIn] = useState('');
  const [selectedOut, setSelectedOut] = useState('');

  const addLog = useCallback((type: string, msg: string) => {
    const ts = new Date().toLocaleTimeString('vi-VN', { hour12: false });
    setLogs(prev => [{ type, msg, ts }, ...prev].slice(0, 50));
  }, []);

  const updateStatus = useCallback((msg: string) => {
    setStatus(msg);
    setTimeout(() => setStatus('System Ready'), 2500);
  }, []);

  const sendCubaseCmd = useCallback((cmdKey: string) => {
    const pc = CMD_PC[cmdKey];
    if (pc !== undefined) {
      midi.send([0xC0, pc]); // Program Change on Channel 1
      addLog('ctrl', `Cubase Command: ${CMD_MAP[cmdKey] || cmdKey} (PC ${pc})`);
      updateStatus(`Đã gửi lệnh: ${CMD_MAP[cmdKey] || cmdKey}`);
    } else {
      addLog('warn', `No PC mapping for command: ${cmdKey}`);
    }
  }, [midi.send, addLog, updateStatus]);

  const onMidiMessage = useCallback((ev: WebMidi.MIDIMessageEvent) => {
    const [st, note, vel] = ev.data;
    const type = st & 0xF0;
    const ch = (st & 0x0F) + 1;
    if (type === 0x90 && vel > 0) addLog('midi', `NoteON ch${ch} n=${note} v=${vel}`);
    else if (type === 0xB0) addLog('midi', `CC ch${ch} #${note}=${vel}`);
  }, [addLog]);

  useEffect(() => {
    if (selectedIn || selectedOut) {
      midi.connect(selectedIn, selectedOut, onMidiMessage);
    }
  }, [selectedIn, selectedOut]);

  useEffect(() => {
    let interval: number | undefined;
    if (isPlaying) {
      interval = window.setInterval(() => {
        setTcSec(prev => prev + 1);
        setVuLevels(prev => prev.map((_, i) => {
          const base = [70, 45, 35, 60, 40, 25][i];
          return Math.max(5, Math.min(95, base + Math.random() * 30 - 15));
        }));
      }, 1000);
    } else {
      setVuLevels(Array(6).fill(5));
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="min-h-screen bg-[#050505] text-[#d1d5db] font-sans flex items-center justify-center p-4">
      <div className="w-[1024px] h-[768px] bg-[#050505] flex flex-col border border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden select-none">
        
        {/* Top Header / Title Bar */}
        <header className="h-12 bg-linear-to-r from-[#111] to-[#1a1a1a] border-b border-[#2a2a2a] flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-600 shadow-[0_0_8px_#dc2626]"></div>
            <span className="font-['Orbitron'] font-black text-sm tracking-[0.2em] text-white">TOOL LITE PRO <span className="text-red-600">V2.5</span></span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded border border-[#333]">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">HSD:</span>
              <span className="text-[10px] text-green-500 font-mono">22 / 04 / 2027</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded flex items-center justify-center bg-[#222] text-xs hover:bg-[#333] cursor-pointer"><Minus size={14} /></div>
              <div className="w-6 h-6 rounded flex items-center justify-center bg-[#222] text-xs hover:bg-[#333] cursor-pointer">▢</div>
              <div className="w-6 h-6 rounded flex items-center justify-center bg-red-800 text-xs hover:bg-red-700 cursor-pointer text-white text-sm"><X size={14} /></div>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <nav className="h-10 bg-[#0a0a0a] border-b border-[#1a1a1a] flex px-4 shrink-0">
          {(['main', 'midi', 'cubase'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 h-full text-[11px] font-bold tracking-widest uppercase transition-all
                ${activeTab === tab 
                  ? 'text-red-500 border-b-2 border-red-500 bg-red-500/5' 
                  : 'text-gray-500 hover:text-gray-300'}`}
            >
              {tab === 'main' ? 'Livestream' : tab === 'midi' ? 'MIDI Engine' : 'Cubase Remote'}
            </button>
          ))}
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 p-6 bg-radial from-[#0d0d0d] to-[#050505] overflow-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'main' && (
              <motion.div
                key="main" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-12 gap-6 h-full"
              >
                {/* Left Sidebar: Quick Actions */}
                <div className="col-span-3 flex flex-col gap-4">
                  <div className="p-4 bg-[#111] rounded-lg border border-[#222] flex flex-col gap-3 shadow-2xl">
                    <h3 className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 border-b border-[#222] pb-2 font-bold">Audio Toggles</h3>
                    {['AUTO PRO OFF', 'NHẠC ON', 'MIC ON', 'REVERB ON'].map((l) => (
                      <button
                        key={l}
                        onClick={() => updateStatus(l)}
                        className={`w-full py-3 rounded text-[11px] font-bold tracking-tighter transition-all border
                          ${l.includes('ON') 
                            ? 'bg-red-900/20 border-red-600/50 text-red-400' 
                            : 'bg-[#1a1a1a] border-[#333] text-gray-400 hover:border-red-600'}`}
                      >
                        {l.split(' ')[0]} <span className={l.includes('ON') ? 'text-red-400' : 'text-red-800'}>{l.split(' ')[1]}</span>
                      </button>
                    ))}
                  </div>

                  <div className="p-4 bg-[#111] rounded-lg border border-[#222] flex flex-col gap-3 shadow-2xl">
                    <h3 className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 border-b border-[#222] pb-2 font-bold">Voice Presets</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <button className="py-4 bg-red-600 text-white rounded text-[10px] font-black uppercase shadow-lg shadow-red-600/20 active:scale-95 transition-transform">Adult</button>
                      <button className="py-4 bg-[#1a1a1a] border border-[#333] text-gray-400 rounded text-[10px] font-black uppercase hover:border-gray-500">Child</button>
                    </div>
                  </div>
                </div>

                {/* Center: Master Controls */}
                <div className="col-span-6 flex flex-col gap-6">
                  {/* Key Display */}
                  <div 
                    className="bg-black border border-[#222] rounded-xl p-8 flex flex-col items-center justify-center relative overflow-hidden shadow-inner shadow-red-900/10 group cursor-pointer"
                    onClick={() => setShowKeyPicker(true)}
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-50"></div>
                    <div className="text-gray-600 text-[11px] font-bold font-['Orbitron'] tracking-[0.4em] uppercase mb-2">Current Key / Tông</div>
                    <div className="flex items-baseline gap-4">
                      <span className="text-7xl font-black text-white font-['Orbitron']">{curNote}</span>
                      <span className="text-4xl font-light text-red-500 uppercase tracking-widest font-['Orbitron']">{curScale.en}</span>
                    </div>
                    <div className="mt-4 flex gap-4 text-xs text-gray-500 font-medium">
                      <span>({VI_NOTES[curNote]} {curScale.vi})</span>
                      <span className="text-red-900">/</span>
                      <span className="text-gray-400">44.1 kHz</span>
                    </div>
                  </div>

                  {/* Control Grid */}
                  <div className="grid grid-cols-3 gap-6">
                    <Knob label="Music Vol" onChange={(v) => addLog('ctrl', `Music: ${Math.round((v+140)/2.8)}%`)} />
                    <Knob label="Mic Gain" color="blue" />
                    <Knob label="Tune Mix" />
                  </div>

                  {/* Big Action Buttons */}
                  <div className="mt-auto flex gap-4">
                    <button 
                      onClick={() => {
                        const nextState = !isRecording;
                        setIsRecording(nextState);
                        sendCubaseCmd('record');
                      }}
                      className={`flex-1 py-5 rounded-lg font-black text-lg tracking-widest uppercase shadow-xl border-t transition-all active:scale-[0.98]
                        ${isRecording 
                          ? 'bg-gradient-to-b from-red-600 to-red-800 border-red-400/30 text-white animate-pulse' 
                          : 'bg-[#111] border-[#333] text-gray-400 hover:border-red-600 hover:text-white'}`}
                    >
                      Record Studio
                    </button>
                    <button className="w-24 py-5 bg-[#111] border border-[#333] rounded-lg flex items-center justify-center text-red-500 hover:border-red-600">
                      <div className={`w-4 h-4 bg-red-600 rounded-full ${isRecording ? 'animate-ping' : ''}`}></div>
                    </button>
                  </div>
                </div>

                {/* Right Sidebar: Cubase / MIDI Status */}
                <div className="col-span-3 flex flex-col gap-4">
                  <div className="p-4 bg-[#111] rounded-lg border border-[#222] flex flex-col shadow-2xl">
                    <h3 className="text-[10px] uppercase tracking-widest text-gray-500 mb-4 border-b border-[#222] pb-2 font-bold">Transport Control</h3>
                    <div className="bg-black p-4 rounded border border-[#222] mb-4 text-center">
                      <div className="text-2xl font-mono text-green-500 tracking-tighter font-bold">{new Date(tcSec * 1000).toISOString().substr(11, 8)}</div>
                      <div className="text-[9px] text-green-900 uppercase font-black tracking-widest mt-1">TC Sychronized</div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      <button className="p-2 bg-[#222] rounded text-xs hover:bg-[#333]" onClick={() => { setTcSec(0); sendCubaseCmd('rewind'); }}><SkipBack size={14} /></button>
                      <button className={`p-2 rounded text-xs transition-all ${!isPlaying ? 'bg-red-600 text-white' : 'bg-[#222] text-[#aaa]'}`} onClick={() => { setIsPlaying(false); sendCubaseCmd('stop'); }}><Square size={14} fill="currentColor" /></button>
                      <button className={`p-2 rounded text-xs transition-all ${isPlaying ? 'bg-red-600 text-white' : 'bg-[#222] text-[#aaa]'}`} onClick={() => { setIsPlaying(true); sendCubaseCmd('play'); }}><Play size={14} fill="currentColor" /></button>
                      <button className="p-2 bg-[#222] rounded text-xs hover:bg-[#333]" onClick={() => sendCubaseCmd('loop')}><Repeat size={14} /></button>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-gray-500 uppercase">Tempo</span>
                      <span className="text-orange-500 font-mono" onClick={() => setShowBpmPicker(true)}>{bpm}.00 BPM</span>
                    </div>
                  </div>

                  <div className="flex-1 p-4 bg-[#0a0a0a] rounded-lg border border-[#222] flex flex-col shadow-2xl min-h-0">
                    <h3 className="text-[10px] uppercase tracking-widest text-gray-500 mb-4 border-b border-[#222] pb-2 font-bold">MIDI I/O Log</h3>
                    <div className="flex-1 font-mono text-[9px] text-gray-600 space-y-2 overflow-y-auto">
                      {logs.length === 0 && <div className="text-gray-800 italic">No events recorded</div>}
                      {logs.map((log, i) => (
                        <div key={i} className="flex gap-2">
                          <span className={`font-bold ${log.type === 'midi' ? 'text-blue-900' : 'text-green-900'}`}>[{log.ts}]</span>
                          <span className="break-all">{log.msg}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'midi' && (
              <motion.div
                key="midi" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }}
                className="grid grid-cols-12 gap-6 h-full"
              >
                <div className="col-span-4 flex flex-col gap-4">
                  <div className="p-4 bg-[#111] rounded-lg border border-[#222] flex flex-col gap-4 shadow-2xl">
                    <h3 className="text-[10px] uppercase tracking-widest text-gray-500 border-b border-[#222] pb-2 font-bold">Hardware I/O</h3>
                    <div className="flex flex-col gap-2">
                      <label className="text-[9px] text-gray-500 font-bold uppercase">MIDI Input</label>
                      <select 
                        className="bg-black border border-[#333] rounded px-2 py-2 text-xs text-gray-400 outline-none focus:border-red-600"
                        value={selectedIn} onChange={(e) => setSelectedIn(e.target.value)}
                      >
                        <option value="">Select Input</option>
                        {midi.inputs.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[9px] text-gray-500 font-bold uppercase">MIDI Output</label>
                      <select 
                        className="bg-black border border-[#333] rounded px-2 py-2 text-xs text-gray-400 outline-none focus:border-red-600"
                        value={selectedOut} onChange={(e) => setSelectedOut(e.target.value)}
                      >
                        <option value="">Select Output</option>
                        {midi.outputs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button 
                        onClick={() => {
                          const { inId, outId } = midi.findCubasePorts();
                          if (inId || outId) {
                            setSelectedIn(inId);
                            setSelectedOut(outId);
                            updateStatus('Đã tìm thấy cổng Cubase');
                          } else {
                            updateStatus('Không tìm thấy cổng Cubase');
                          }
                        }}
                        className="flex-1 py-1.5 bg-red-900 border border-red-600 rounded text-[10px] font-black text-white hover:brightness-110 uppercase shadow-lg shadow-red-600/20"
                      >
                        Liên kết Cubase
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedIn('');
                          setSelectedOut('');
                          midi.disconnect();
                          updateStatus('Đã ngắt kết nối');
                        }}
                        className="flex-1 py-1.5 bg-black border border-[#333] rounded text-[10px] font-bold text-gray-500 hover:text-gray-300 uppercase"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>

                <div className="col-span-8 flex flex-col gap-4">
                  <div className="p-4 bg-[#111] rounded-lg border border-[#222] flex flex-col shadow-2xl h-full">
                    <h3 className="text-[10px] uppercase tracking-widest text-gray-500 mb-4 border-b border-[#222] pb-2 font-bold">Loop Performance Pads</h3>
                    <div className="grid grid-cols-4 gap-3">
                      {LNAMES.map((name, i) => (
                        <button
                          key={i}
                          className={`group aspect-square rounded-lg border flex flex-col items-center justify-center gap-1 transition-all
                            ${loopStates[i] === 'play' 
                              ? 'bg-red-900/20 border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.2)]' 
                              : 'bg-black border-[#222] hover:border-red-600/50'}`}
                          onClick={() => {
                            const newState = [...loopStates];
                            newState[i] = newState[i] === 'play' ? 'idle' : 'play';
                            setLoopStates(newState);
                          }}
                        >
                          <span className={`text-[11px] font-black tracking-widest ${loopStates[i] === 'play' ? 'text-red-500' : 'text-gray-500'}`}>{name}</span>
                          <span className="text-[8px] text-gray-700 font-mono">CC#{36+i}</span>
                          <div className="w-6 h-0.5 bg-gray-900 mt-2 relative overflow-hidden rounded-full">
                            {loopStates[i] === 'play' && <motion.div animate={{ x: ['-100%', '100%'] }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="absolute inset-0 bg-red-600" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'cubase' && (
              <motion.div
                key="cubase" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-6 h-full"
              >
                <div className="grid grid-cols-6 gap-3">
                  {CH_NAMES.map((name, i) => (
                    <ChannelFader 
                      key={i} name={name} color={CH_COL[i]} 
                      value={chFaderLevels[i]} 
                      onChange={(v) => {
                        const nl = [...chFaderLevels];
                        nl[i] = v;
                        setChFaderLevels(nl);
                      }} 
                      vuLevel={vuLevels[i]}
                    />
                  ))}
                </div>

                <div className="flex-1 flex flex-col gap-4">
                  <h3 className="text-[10px] uppercase tracking-[0.3em] text-red-600 font-bold border-b border-[#222] pb-2">Cubase Logic Controls</h3>
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-3 overflow-y-auto pr-2">
                    {Object.keys(CMD_MAP).map(key => (
                      <button
                        key={key}
                        onClick={() => sendCubaseCmd(key)}
                        className="bg-[#111] border border-[#222] hover:border-red-600 hover:bg-red-900/10 p-3 rounded-lg flex flex-col items-center justify-center gap-2 transition-all active:scale-95 group"
                      >
                        <span className="text-[14px]">{CMD_MAP[key].split(' ')[0]}</span>
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter text-center group-hover:text-red-400">
                          {CMD_MAP[key].split(' ').slice(1).join(' ')}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Bottom Status Bar */}
        <footer className="h-10 bg-[#0a0a0a] border-t border-[#1a1a1a] flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${midi.status.api === 'ok' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{status}</span>
            </div>
            <div className="w-px h-3 bg-[#333]"></div>
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Latency: 12ms</span>
          </div>

          <div className="flex-1 px-12">
            <div className="h-1 w-full bg-[#111] rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-red-800 to-red-500"
                animate={{ width: isPlaying ? '100%' : '2/3' }}
                transition={{ duration: 1 }}
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-[10px] font-bold">
              <span className="text-gray-500 uppercase">Engine Status</span>
              <span className="text-green-500 uppercase">Online</span>
            </div>
            <div className="flex items-center gap-1">
              {[1, 3, 2, 4].map((h, i) => (
                <div key={i} className={`w-1 rounded-full ${i % 2 === 0 ? 'bg-gray-700 h-1' : 'bg-red-600 h-2'}`} />
              ))}
            </div>
          </div>
        </footer>
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {showKeyPicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowKeyPicker(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-[#111] border border-[#222] rounded-xl p-6 w-[320px] shadow-2xl">
              <h3 className="font-['Orbitron'] text-xs text-red-600 tracking-[0.2em] mb-4 uppercase border-b border-[#222] pb-2 font-bold">CHỌN TÔNG / KEY</h3>
              <div className="grid grid-cols-4 gap-2 mb-6">
                {NOTES.map(n => (
                  <button 
                    key={n} onClick={() => setCurNote(n)} 
                    className={`p-2.5 rounded text-xs font-black font-['Orbitron'] border transition-all 
                      ${curNote === n ? 'bg-red-600 border-red-400 text-white shadow-lg' : 'bg-black border-[#222] text-gray-500 hover:border-red-600'}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                {SCALES.map(s => (
                  <button 
                    key={s.en} onClick={() => setCurScale(s)} 
                    className={`flex-1 p-3 rounded text-xs font-black uppercase transition-all border
                      ${curScale.en === s.en ? 'bg-red-600 border-red-400 text-white' : 'bg-black border-[#222] text-gray-500'}`}
                  >
                    {s.en}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBpmPicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowBpmPicker(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-[#111] border border-[#222] rounded-xl p-8 w-[240px] text-center shadow-2xl">
              <h3 className="font-['Orbitron'] text-xs text-orange-500 tracking-[0.2em] mb-6 uppercase font-bold">Project Tempo</h3>
              <input 
                type="number" 
                className="w-full bg-black border-2 border-orange-500/50 rounded-lg p-4 text-4xl font-black text-orange-500 text-center font-mono outline-none mb-6 shadow-inner" 
                value={bpm} onChange={(e) => setBpm(Number(e.target.value))} 
              />
              <button onClick={() => setShowBpmPicker(false)} className="w-full py-4 bg-red-600 hover:bg-red-500 rounded-lg text-white font-black text-sm uppercase tracking-widest shadow-lg transition-colors">Apply</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
