import { useEffect, useRef, useState } from 'react';
import './ChatWidget.css';
import { streamChat } from '../api';

const WITH_SCAN = ['What does my top finding mean?', 'How reliable are these results?', 'How does booking work?'];
const NO_SCAN = ['How does this app work?', 'What kind of image can I upload?'];

export default function ChatWidget({ predictions }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef(null);
  const endRef = useRef(null);
  const previousPredictions = useRef(predictions);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, open]);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (previousPredictions.current !== predictions) {
      abortRef.current?.abort();
      setMessages([]);
      setError('');
    }
    previousPredictions.current = predictions;
  }, [predictions]);

  const send = async (text) => {
    const content = text.trim();
    if (!content || busy) return;

    const history = [...messages, { role: 'user', content }];
    setMessages([...history, { role: 'assistant', content: '' }]);
    setInput('');
    setError('');
    setBusy(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamChat({
        messages: history.slice(-8),
        predictions: predictions || [],
        signal: controller.signal,
        onToken: (token) => setMessages((current) => {
          const updated = current.slice();
          const last = updated[updated.length - 1];
          updated[updated.length - 1] = { ...last, content: last.content + token };
          return updated;
        }),
      });
    } catch (requestError) {
      if (requestError.name !== 'AbortError') setError(requestError.message);
    } finally {
      setMessages((current) => (
        current.length && current[current.length - 1].role === 'assistant' && !current[current.length - 1].content
          ? current.slice(0, -1)
          : current
      ));
      setBusy(false);
      abortRef.current = null;
    }
  };

  const clear = () => {
    abortRef.current?.abort();
    setMessages([]);
    setError('');
  };

  const suggestions = predictions ? WITH_SCAN : NO_SCAN;

  return (
    <>
      {!open && <button className="chat-fab mono" onClick={() => setOpen(true)}>Ask the assistant</button>}
      {open && (
        <aside className="chat" aria-label="AI assistant">
          <header className="chat__head">
            <span className="chat__title mono">LOCAL AI ASSISTANT</span>
            <div className="chat__tools">
              {messages.length > 0 && <button className="chat__tool mono" onClick={clear}>Clear</button>}
              <button className="chat__tool mono" onClick={() => setOpen(false)} aria-label="Close assistant">Close</button>
            </div>
          </header>

          <div className="chat__log" role="log" aria-live="polite" aria-relevant="additions text">
            {messages.length === 0 && (
              <div className="chat__empty">
                <p>{predictions ? 'Ask about these scan estimates or the appointment process.' : 'Ask about the app, or upload a scan to discuss its estimates.'}</p>
                {suggestions.map((suggestion) => (
                  <button key={suggestion} className="chat__chip" onClick={() => send(suggestion)}>{suggestion}</button>
                ))}
              </div>
            )}
            {messages.map((message, index) => (
              <div key={`${index}-${message.role}`} className={`chat__msg chat__msg--${message.role}`}>
                {message.content || (busy && index === messages.length - 1
                  ? <span className="chat__typing" aria-label="Assistant is responding"><i /><i /><i /></span>
                  : null)}
              </div>
            ))}
            {error && <p className="chat__error">{error}</p>}
            <div ref={endRef} />
          </div>

          <form className="chat__form" onSubmit={(event) => { event.preventDefault(); send(input); }}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask a question..."
              maxLength={2000}
              disabled={busy}
              aria-label="Message the assistant"
            />
            {busy
              ? <button type="button" className="chat__send" onClick={() => abortRef.current?.abort()}>Stop</button>
              : <button type="submit" className="chat__send" disabled={!input.trim()}>Send</button>}
          </form>
        </aside>
      )}
    </>
  );
}
