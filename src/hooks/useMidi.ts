import { useEffect, useState, useCallback, useRef } from 'react';

export type MidiAccess = WebMidi.MIDIAccess;
export type MidiInput = WebMidi.MIDIInput;
export type MidiOutput = WebMidi.MIDIOutput;

export function useMidi() {
  const [access, setAccess] = useState<MidiAccess | null>(null);
  const [inputs, setInputs] = useState<MidiInput[]>([]);
  const [outputs, setOutputs] = useState<MidiOutput[]>([]);
  const [status, setStatus] = useState({ api: 'closed', in: '', out: '' });
  const [lastMessage, setLastMessage] = useState<WebMidi.MIDIMessageEvent | null>(null);
  const selectedInRef = useRef<MidiInput | null>(null);
  const selectedOutRef = useRef<MidiOutput | null>(null);

  const refreshDevices = useCallback((midiAccess: MidiAccess) => {
    const inputList: MidiInput[] = [];
    const outputList: MidiOutput[] = [];
    midiAccess.inputs.forEach((input) => inputList.push(input));
    midiAccess.outputs.forEach((output) => outputList.push(output));
    setInputs(inputList);
    setOutputs(outputList);
  }, []);

  const findCubasePorts = useCallback(() => {
    const keywords = ['cubase', 'loopmidi', 'loopbe', 'virtual'];
    const foundIn = inputs.find(i => keywords.some(k => i.name?.toLowerCase().includes(k)));
    const foundOut = outputs.find(o => keywords.some(k => o.name?.toLowerCase().includes(k)));
    return { inId: foundIn?.id || '', outId: foundOut?.id || '' };
  }, [inputs, outputs]);

  useEffect(() => {
    if (!navigator.requestMIDIAccess) {
      console.warn('Web MIDI API not supported');
      setStatus((s) => ({ ...s, api: 'unsupported' }));
      return;
    }

    navigator.requestMIDIAccess({ sysex: true }).then(
      (midiAccess) => {
        setAccess(midiAccess);
        setStatus((s) => ({ ...s, api: 'ok' }));
        refreshDevices(midiAccess);
        midiAccess.onstatechange = () => refreshDevices(midiAccess);
      },
      (err) => {
        console.error('MIDI Access denied', err);
        setStatus((s) => ({ ...s, api: 'denied' }));
      }
    );
  }, [refreshDevices]);

  const connect = useCallback((inputId: string, outputId: string, onMessage: (ev: WebMidi.MIDIMessageEvent) => void) => {
    if (!access) return;

    if (selectedInRef.current) {
      selectedInRef.current.onmidimessage = null;
    }

    const input = access.inputs.get(inputId);
    const output = access.outputs.get(outputId);

    if (input) {
      input.onmidimessage = (ev) => {
        setLastMessage(ev);
        onMessage(ev);
      };
      selectedInRef.current = input;
    }
    if (output) {
      selectedOutRef.current = output;
    }

    setStatus((s) => ({
      ...s,
      in: input?.name || '',
      out: output?.name || '',
    }));
  }, [access]);

  const disconnect = useCallback(() => {
    if (selectedInRef.current) {
      selectedInRef.current.onmidimessage = null;
      selectedInRef.current = null;
    }
    selectedOutRef.current = null;
    setStatus((s) => ({ ...s, in: '', out: '' }));
  }, []);

  const send = useCallback((data: number[] | Uint8Array) => {
    if (selectedOutRef.current) {
      selectedOutRef.current.send(data);
    }
  }, []);

  return {
    inputs,
    outputs,
    status,
    connect,
    disconnect,
    send,
    lastMessage,
    findCubasePorts,
  };
}
