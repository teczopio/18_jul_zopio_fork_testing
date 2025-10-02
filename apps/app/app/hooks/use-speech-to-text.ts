/**
 * SPDX-License-Identifier: MIT
 */

'use client';
/* global SpeechRecognition, SpeechRecognitionEvent, SpeechRecognitionErrorEvent */

import { useCallback, useEffect, useRef, useState } from 'react';

// Hook options
export interface UseSpeechToTextOptions {
  lang?: string; // e.g. "tr-TR"
  interimResults?: boolean;
  continuous?: boolean;
  onTranscription?: (text: string, isFinal: boolean) => void;
}

export interface UseSpeechToTextReturn {
  isSupported: boolean;
  isRecording: boolean;
  interimText: string;
  error: string | null;
  start: () => Promise<boolean>;
  stop: () => void;
}

// Lightweight, client-only Web Speech API wrapper
export function useSpeechToText({
  lang = 'tr-TR',
  interimResults = true,
  continuous = true,
  onTranscription,
}: UseSpeechToTextOptions = {}): UseSpeechToTextReturn {
  const recognitionRef = useRef<globalThis.SpeechRecognition | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Detect support only on client
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const SR =
      (window as Window).SpeechRecognition ??
      (window as Window).webkitSpeechRecognition;
    setIsSupported(Boolean(SR));
  }, []);

  const cleanupRecognition = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) {
      return;
    }
    rec.onresult = null;
    rec.onerror = null;
    rec.onend = null;
    rec.onstart = null;
    recognitionRef.current = null;
  }, []);

  const stop = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
  }, []);

  const start = useCallback(async (): Promise<boolean> => {
    setError(null);
    if (typeof window === 'undefined') {
      return false;
    }

    const SR =
      (window as Window).SpeechRecognition ??
      (window as Window).webkitSpeechRecognition;
    if (!SR) {
      setIsSupported(false);
      setError('Tarayıcı konuşma tanımayı desteklemiyor.');
      return false;
    }

    // Best effort permission preflight for consistent UX
    try {
      if (navigator?.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        for (const t of stream.getTracks()) {
          t.stop();
        }
      }
    } catch (_e) {
      setError('Mikrofon izni reddedildi veya alınamadı.');
      return false;
    }

    try {
      const rec: globalThis.SpeechRecognition = new SR();
      recognitionRef.current = rec;
      rec.lang = lang;
      rec.interimResults = interimResults;
      rec.continuous = continuous;

      rec.onresult = (event: globalThis.SpeechRecognitionEvent) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          transcript += res[0]?.transcript ?? '';
          if (res.isFinal) {
            setInterimText(transcript);
            onTranscription?.(transcript.trim(), true);
          } else {
            setInterimText(transcript);
            onTranscription?.(transcript, false);
          }
        }
      };

      rec.onerror = (e: globalThis.SpeechRecognitionErrorEvent) => {
        setError(e.message || e.error || 'Bilinmeyen hata');
      };

      rec.onend = () => {
        setIsRecording(false);
        cleanupRecognition();
      };

      rec.onstart = () => {
        setIsRecording(true);
      };

      rec.start();
      return true;
    } catch (_e) {
      setError('Konuşma tanıma başlatılamadı.');
      return false;
    }
  }, [cleanupRecognition, continuous, interimResults, lang, onTranscription]);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.abort();
      } catch {
        // ignore
      }
      cleanupRecognition();
    };
  }, [cleanupRecognition]);

  return { isSupported, isRecording, interimText, error, start, stop };
}
