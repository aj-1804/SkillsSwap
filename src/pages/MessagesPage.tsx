import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { 
  MessageSquare, 
  Send, 
  User, 
  Clock, 
  Loader2, 
  Search,
  CheckCheck
} from 'lucide-react';

export const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlUserId = searchParams.get('userId');

  const [conversations, setConversations] = useState<any[]>([]);
  const [activePartnerId, setActivePartnerId] = useState<number | null>(
    urlUserId ? parseInt(urlUserId, 10) : null
  );
  const [activePartner, setActivePartner] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (activePartnerId) {
      loadMessages(activePartnerId);
    }
  }, [activePartnerId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      setLoadingConv(true);
      const res = await api.get('/messages/conversations');
      if (res.data.success) {
        setConversations(res.data.data);
        // If no active partner selected yet and we have conversations, select first
        if (!activePartnerId && res.data.data.length > 0) {
          setActivePartnerId(res.data.data[0].other_user_id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingConv(false);
    }
  };

  const loadMessages = async (partnerId: number) => {
    try {
      setLoadingMessages(true);
      const res = await api.get(`/messages/conversation/${partnerId}`);
      if (res.data.success) {
        setMessages(res.data.messages);
        setActivePartner(res.data.otherUser);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activePartnerId) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');

    try {
      const res = await api.post('/messages', {
        receiver_id: activePartnerId,
        content,
      });

      if (res.data.success) {
        setMessages((prev) => [...prev, res.data.message]);
        loadConversations();
      }
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setSending(false);
    }
  };

  const selectPartner = (id: number) => {
    setActivePartnerId(id);
    setSearchParams({ userId: String(id) });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Student Messages
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Coordinate lesson timings, discussion agendas, and peer skill swaps
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden grid grid-cols-1 md:grid-cols-3 h-[600px]">
        {/* Left Col: Conversation Threads */}
        <div className="border-r border-slate-200 flex flex-col h-full bg-slate-50/50">
          <div className="p-4 border-b border-slate-200 bg-white">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Conversations
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loadingConv ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-indigo-600 mb-1" />
                Loading chats...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 italic">
                No active message threads yet. Visit a skill listing to message an instructor!
              </div>
            ) : (
              conversations.map((c) => {
                const isSelected = activePartnerId === c.other_user_id;
                return (
                  <button
                    key={c.id}
                    onClick={() => selectPartner(c.other_user_id)}
                    className={`w-full p-3.5 text-left flex items-start gap-3 transition-colors cursor-pointer ${
                      isSelected ? 'bg-indigo-50/80 border-l-4 border-indigo-600' : 'hover:bg-slate-100/60'
                    }`}
                  >
                    <img
                      src={c.other_user_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${c.other_user_name}`}
                      alt={c.other_user_name}
                      className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {c.other_user_name}
                        </span>
                        {c.unread_count > 0 && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {c.last_message || 'No messages yet'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right 2 Cols: Message Feed & Chat Input */}
        <div className="md:col-span-2 flex flex-col h-full bg-white">
          {activePartnerId && activePartner ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <img
                    src={activePartner.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${activePartner.name}`}
                    alt={activePartner.name}
                    className="w-9 h-9 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{activePartner.name}</h3>
                    <p className="text-[11px] text-slate-500">{activePartner.location || 'India'}</p>
                  </div>
                </div>
              </div>

              {/* Messages Container */}
              <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-slate-50/40">
                {loadingMessages ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-indigo-600 mb-1" />
                    Loading conversation...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 italic">
                    Say hello to {activePartner.name} to discuss skill exchange details!
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.sender_id === user?.id;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-xs sm:max-w-md p-3 rounded-2xl text-xs leading-relaxed shadow-xs ${
                            isMe
                              ? 'bg-indigo-600 text-white rounded-br-none'
                              : 'bg-white border border-slate-200 text-slate-900 rounded-bl-none'
                          }`}
                        >
                          <p>{m.content}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 px-1">
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Send Form */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Message ${activePartner.name}...`}
                  className="flex-1 text-xs px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <MessageSquare className="w-10 h-10 mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">Select a Conversation</p>
              <p className="text-xs text-slate-500 mt-1">
                Choose a student from the sidebar to view your message history.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
