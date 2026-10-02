import { useCallback, useEffect, useRef, useState } from 'react'

export function useTextToSpeech() {
  const [supported, setSupported] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [activeSegment, setActiveSegment] = useState(-1)
  const runId = useRef(0)

  useEffect(() => {
    setSupported(
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      'SpeechSynthesisUtterance' in window
    )
    return () => {
      runId.current += 1
      window.speechSynthesis?.cancel()
    }
  }, [])

  const stop = useCallback(() => {
    runId.current += 1
    window.speechSynthesis?.cancel()
    setIsSpeaking(false)
    setIsPaused(false)
    setActiveSegment(-1)
  }, [])

  const speakSegments = useCallback((segments: string[]) => {
    if (!('speechSynthesis' in window) || !segments.length) return
    runId.current += 1
    const currentRun = runId.current
    window.speechSynthesis.cancel()
    setIsSpeaking(true)
    setIsPaused(false)

    const speakAt = (index: number) => {
      if (currentRun !== runId.current) return
      if (index >= segments.length) {
        setIsSpeaking(false)
        setIsPaused(false)
        setActiveSegment(-1)
        return
      }

      const utterance = new SpeechSynthesisUtterance(segments[index])
      setActiveSegment(index)
      utterance.onend = () => speakAt(index + 1)
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
  }, [])

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

  return { supported, isSpeaking, isPaused, activeSegment, speakSegments, pause, resume, stop }
}