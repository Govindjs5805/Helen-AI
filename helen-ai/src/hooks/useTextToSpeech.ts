import { useCallback, useEffect, useRef, useState } from 'react'

interface SpeechOptions {
  rate?: number
  voice?: string
  pauseSeconds?: number
}

export function useTextToSpeech(defaultOptions: SpeechOptions = {}) {
  const [supported, setSupported] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [activeSegment, setActiveSegment] = useState(-1)
  const [activeCharacter, setActiveCharacter] = useState(-1)
  const runId = useRef(0)
  const pauseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setSupported(
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      'SpeechSynthesisUtterance' in window
    )
    return () => {
      runId.current += 1
      if (pauseTimer.current) clearTimeout(pauseTimer.current)
      window.speechSynthesis?.cancel()
    }
  }, [])

  const stop = useCallback(() => {
    runId.current += 1
    if (pauseTimer.current) clearTimeout(pauseTimer.current)
    window.speechSynthesis?.cancel()
    setIsSpeaking(false)
    setIsPaused(false)
    setActiveSegment(-1)
    setActiveCharacter(-1)
  }, [])

  const speakSegments = useCallback((segments: string[], options: SpeechOptions = {}) => {
    if (!('speechSynthesis' in window) || !segments.length) return
    runId.current += 1
    const currentRun = runId.current
    if (pauseTimer.current) clearTimeout(pauseTimer.current)
    window.speechSynthesis.cancel()
    setIsSpeaking(true)
    setIsPaused(false)
    const settings = { ...defaultOptions, ...options }

    const speakAt = (index: number) => {
      if (currentRun !== runId.current) return
      if (index >= segments.length) {
        setIsSpeaking(false)
        setIsPaused(false)
        setActiveSegment(-1)
        setActiveCharacter(-1)
        return
      }

      const utterance = new SpeechSynthesisUtterance(segments[index])
      utterance.rate = settings.rate ?? 1
      if (settings.voice) {
        const voice = window.speechSynthesis.getVoices().find(item => item.name === settings.voice)
        if (voice) utterance.voice = voice
      }
      setActiveSegment(index)
      setActiveCharacter(-1)
      utterance.onboundary = event => setActiveCharacter(event.charIndex)
      utterance.onend = () => {
        const delay = Math.max(0, (settings.pauseSeconds ?? 0) * 1000)
        if (delay) pauseTimer.current = setTimeout(() => speakAt(index + 1), delay)
        else speakAt(index + 1)
      }
      utterance.onerror = event => {
        if (event.error === 'canceled' || event.error === 'interrupted') return
        if (currentRun === runId.current) {
          setIsSpeaking(false)
          setIsPaused(false)
          setActiveSegment(-1)
        }
      }
      window.speechSynthesis.speak(utterance)
    }

    speakAt(0)
  }, [defaultOptions])

  const pause = useCallback(() => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.pause()
    setIsPaused(true)
  }, [])

  const resume = useCallback(() => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.resume()
    setIsPaused(false)
  }, [])

  return { supported, isSpeaking, isPaused, activeSegment, activeCharacter, speakSegments, pause, resume, stop }
}