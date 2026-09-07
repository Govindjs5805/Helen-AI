import { useState } from 'react'

interface Message {
  text: string
  sender: 'user' | 'ai'
}

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (!input.trim()) return
    setMessages([...messages, { text: input, sender: 'user' }])
    setInput('')
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="font-heading text-2xl font-bold text-text">AI Assistant</h1>
      <p className="mt-2 text-text/70">Your AI-powered learning companion</p>

      <div className="mt-6 rounded-2xl border border-black/10 bg-surface p-6 dark:border-white/10">
        <div className="mb-4 h-64 overflow-y-auto rounded-lg bg-background p-4">
          {messages.length === 0 ? (
            <p className="text-text/50">Start a conversation with your AI assistant</p>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`mb-2 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                <span className={`inline-block rounded-lg px-3 py-2 ${msg.sender === 'user' ? 'bg-primary/10 text-primary' : 'bg-text/10 text-text/70'}`}>{msg.text}</span>
              </div>
            ))
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask anything..."
            className="flex-1 rounded-lg border border-black/10 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:border-white/10"
          />
          <button
            onClick={handleSend}
            className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}