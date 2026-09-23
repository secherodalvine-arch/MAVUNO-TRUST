import React, { useState, useEffect, useRef } from 'react';
import { useAuthContext } from '../context/AuthContext';
import {
  getConversations,
  getConversationById,
  createOrGetConversation,
  getMessages,
  sendMessage
} from '../services/chatService';
import type { ConversationDTO, MessageDTO } from '../services/chatService';
import { socketService } from '../services/socketService';
import { useLocation } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  Lock,
  Search,
  ChevronLeft,
  Check,
  CheckCheck,
} from 'lucide-react';
import LoadSpinner from '../components/LoadSpinner';
import './MessagesPage.css';

export const MessagesPage: React.FC = () => {
  const { user, accessToken } = useAuthContext();
  const location = useLocation();
  const currentUserId = user?.id || (user as any)?._id;

  const [conversations, setConversations] = useState<ConversationDTO[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initial load of conversations and socket setup
  useEffect(() => {
    fetchConversations();

    if (accessToken) {
      socketService.connect(accessToken);

      socketService.onNewMessage((newMsg: MessageDTO) => {
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });

        // Update conversation list snippet and move to top
        setConversations((prev) => {
          const copy = [...prev];
          const idx = copy.findIndex((c) => c._id === newMsg.conversationId);
          if (idx !== -1) {
            copy[idx] = {
              ...copy[idx],
              lastMessageAt: newMsg.createdAt,
              lastMessageText: newMsg.content,
              lastMessageSenderId: newMsg.senderId,
              lastMessageStatus: newMsg.status,
            };
            const [moved] = copy.splice(idx, 1);
            copy.unshift(moved);
          }
          return copy;
        });
      });

      socketService.onMessagesRead(({ conversationId }) => {
        setMessages((prev) =>
          prev.map((m) => (m.senderId === currentUserId ? { ...m, status: 'READ' } : m))
        );
        setConversations((prev) =>
          prev.map((c) => (c._id === conversationId ? { ...c, lastMessageStatus: 'READ' } : c))
        );
      });
    }

    return () => {
      socketService.disconnect();
    };
  }, [accessToken, currentUserId]);

  // Synchronize URL search params (e.g. ?conversationId=... or ?recipientId=... or ?userId=... or ?dealerId=...)
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const convId = queryParams.get('conversationId');
    const targetUserId = queryParams.get('userId') || queryParams.get('recipientId') || queryParams.get('dealerId');

    if (convId) {
      setActiveConversationId(convId);
      // Ensure conversation exists in state
      if (!conversations.some((c) => c._id === convId)) {
        getConversationById(convId)
          .then((conv) => {
            setConversations((prev) => {
              if (prev.some((c) => c._id === conv._id)) return prev;
              return [conv, ...prev];
            });
          })
          .catch(console.error);
      }
    } else if (targetUserId && !loading) {
      // Find existing or create new conversation with this user
      const existing = conversations.find((c) =>
        c.participants.some((p) => p._id === targetUserId)
      );

      if (existing) {
        setActiveConversationId(existing._id);
      } else {
        createOrGetConversation(targetUserId)
          .then((newConv) => {
            setConversations((prev) => {
              if (prev.some((c) => c._id === newConv._id)) return prev;
              return [newConv, ...prev];
            });
            setActiveConversationId(newConv._id);
          })
          .catch(console.error);
      }
    }
  }, [location.search, loading]);

  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId);
      socketService.joinConversation(activeConversationId);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [activeConversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const data = await getConversations();
      setConversations(data);

      const queryParams = new URLSearchParams(location.search);
      const convId = queryParams.get('conversationId');
      const targetUserId = queryParams.get('userId') || queryParams.get('recipientId') || queryParams.get('dealerId');

      if (convId) {
        setActiveConversationId(convId);
      } else if (targetUserId) {
        const existing = data.find((c) =>
          c.participants.some((p) => p._id === targetUserId)
        );
        if (existing) {
          setActiveConversationId(existing._id);
        } else {
          try {
            const newConv = await createOrGetConversation(targetUserId);
            setConversations([newConv, ...data]);
            setActiveConversationId(newConv._id);
          } catch (err) {
            console.error('Failed to create/get conversation for user:', err);
          }
        }
      } else if (data.length > 0 && !activeConversationId && window.innerWidth > 680) {
        setActiveConversationId(data[0]._id);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      setMessagesLoading(true);
      const data = await getMessages(conversationId);
      setMessages(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversationId || !newMessage.trim() || sending) return;

    const messageText = newMessage.trim();
    try {
      setSending(true);
      const sentMsg = await sendMessage(activeConversationId, messageText);
      setMessages((prev) => {
        if (prev.some((m) => m._id === sentMsg._id)) return prev;
        return [...prev, sentMsg];
      });
      setNewMessage('');

      // Update last message time & snippet in conversation list & bubble to top
      setConversations((prev) => {
        const copy = [...prev];
        const idx = copy.findIndex((c) => c._id === activeConversationId);
        if (idx !== -1) {
          copy[idx] = {
            ...copy[idx],
            lastMessageAt: new Date().toISOString(),
            lastMessageText: messageText,
            lastMessageSenderId: currentUserId,
            lastMessageStatus: 'SENT',
          };
          const [moved] = copy.splice(idx, 1);
          copy.unshift(moved);
        }
        return copy;
      });
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const activeConversation = conversations.find((c) => c._id === activeConversationId);
  const activeCounterparty = activeConversation?.participants.find((p) => p._id !== currentUserId);

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    const cp = c.participants.find((p) => p._id !== currentUserId);
    const nameMatch = cp?.fullName?.toLowerCase().includes(searchQuery.toLowerCase());
    const cropMatch = c.relatedListingId?.cropName?.toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || cropMatch;
  });

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="messages-container">
      {/* ── Left Sidebar (Conversations List) ── */}
      <aside
        className={`messages-sidebar ${
          activeConversationId ? 'messages-sidebar--hidden' : ''
        }`}
        aria-label="Conversations"
      >
        <div className="messages-sidebar-header">
          <div className="messages-sidebar-title-row">
            <h2 className="messages-sidebar-title">
              <MessageSquare size={19} className="text-emerald" />
              Messages
            </h2>
            <span className="messages-sidebar-count">
              {conversations.length} {conversations.length === 1 ? 'chat' : 'chats'}
            </span>
          </div>

          <div className="messages-search-wrap">
            <Search size={15} className="messages-search-icon" />
            <input
              type="text"
              className="messages-search-input"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="messages-conv-list">
          {loading ? (
            <div style={{ padding: '40px 0' }}>
              <LoadSpinner size="sm" text="Loading chats..." />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="messages-empty-sidebar">
              <MessageSquare size={36} opacity={0.4} />
              <span>{searchQuery ? 'No matching conversations' : 'No active conversations'}</span>
            </div>
          ) : (
            filteredConversations.map((convo) => {
              const counterparty = convo.participants.find((p) => p._id !== currentUserId);
              const isSelected = activeConversationId === convo._id;
              const initial = counterparty?.fullName?.charAt(0).toUpperCase() || 'U';

              return (
                <button
                  type="button"
                  key={convo._id}
                  onClick={() => setActiveConversationId(convo._id)}
                  className={`messages-conv-item ${
                    isSelected ? 'messages-conv-item--active' : ''
                  }`}
                >
                  <div className="messages-avatar">{initial}</div>
                  <div className="messages-conv-details">
                    <div className="messages-conv-header">
                      <span className="messages-conv-name">
                        {counterparty?.fullName || 'User'}
                      </span>
                      <span className="messages-conv-time">
                        {formatTime(convo.lastMessageAt || convo.updatedAt)}
                      </span>
                    </div>

                    <div className="messages-conv-sub">
                      {convo.lastMessageText ? (
                        <span className="messages-snippet-text">
                          {convo.lastMessageSenderId === currentUserId && (
                            <span className="snippet-you">You: </span>
                          )}
                          {convo.lastMessageText}
                        </span>
                      ) : convo.relatedListingId ? (
                        <span className="messages-crop-badge">
                          {convo.relatedListingId.cropName} &middot; {convo.relatedListingId.estimatedQuantity} {convo.relatedListingId.unit}
                        </span>
                      ) : (
                        <span className="messages-snippet-empty">Tap to start chatting</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* ── Main Chat Area ── */}
      <section
        className={`messages-main ${
          !activeConversationId ? 'messages-main--hidden' : ''
        }`}
        aria-label="Active Conversation"
      >
        {activeConversation ? (
          <>
            {/* Header */}
            <div className="messages-chat-header">
              <div className="messages-chat-header-left">
                {/* Mobile Back Button */}
                <button
                  type="button"
                  className="messages-back-btn"
                  onClick={() => setActiveConversationId(null)}
                  aria-label="Back to conversations list"
                >
                  <ChevronLeft size={20} />
                </button>

                <div className="messages-avatar" style={{ width: 38, height: 38, fontSize: '0.85rem' }}>
                  {activeCounterparty?.fullName?.charAt(0).toUpperCase() || 'U'}
                </div>

                <div className="messages-chat-title-group">
                  <h3 className="messages-chat-counterparty">
                    {activeCounterparty?.fullName || 'Counterparty'}
                  </h3>
                  <div className="messages-chat-sub">
                    {activeConversation.relatedListingId ? (
                      <span>
                        Produce: <strong style={{ color: '#5ec285' }}>{activeConversation.relatedListingId.cropName}</strong> ({activeConversation.relatedListingId.estimatedQuantity} {activeConversation.relatedListingId.unit})
                      </span>
                    ) : (
                      <span className="messages-direct-badge">Direct Chat</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="messages-secure-badge">
                <Lock size={13} />
                <span>Audited Deal Room</span>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="messages-history">
              {messagesLoading ? (
                <div style={{ padding: '60px 0' }}>
                  <LoadSpinner size="md" text="Loading message history..." />
                </div>
              ) : messages.length === 0 ? (
                <div className="messages-no-chat-selected" style={{ height: '100%' }}>
                  <div className="messages-no-chat-icon">
                    <MessageSquare size={28} />
                  </div>
                  <h4 className="messages-no-chat-heading">
                    {activeCounterparty?.fullName ? `Chat with ${activeCounterparty.fullName}` : 'Start the Negotiation'}
                  </h4>
                  <p className="messages-no-chat-sub">
                    Send a direct message to inquire about produce requirements, pricing, pickup schedules, or contract terms.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.senderId === currentUserId;

                  return (
                    <div
                      key={msg._id}
                      className={`messages-row ${
                        isMine ? 'messages-row--mine' : 'messages-row--theirs'
                      }`}
                    >
                      <div
                        className={`messages-bubble ${
                          isMine ? 'messages-bubble--mine' : 'messages-bubble--theirs'
                        }`}
                      >
                        <div className="messages-bubble-text">{msg.content}</div>
                        <div className="messages-bubble-footer">
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {isMine && (
                            msg.status === 'READ' ? (
                              <span className="msg-status-badge msg-status-seen" title="Read by recipient">
                                <CheckCheck size={13} className="seen-check" />
                                <span>Seen</span>
                              </span>
                            ) : (
                              <span className="msg-status-badge msg-status-sent" title="Sent">
                                <Check size={12} className="sent-check" />
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="messages-input-area">
              <form onSubmit={handleSendMessage} className="messages-form">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={
                    activeCounterparty
                      ? `Type a message to ${activeCounterparty.fullName}...`
                      : 'Type negotiation terms, price offers, or questions...'
                  }
                  className="messages-input"
                  disabled={sending}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="messages-send-btn"
                  aria-label="Send message"
                >
                  <Send size={16} />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="messages-no-chat-selected">
            <div className="messages-no-chat-icon">
              <MessageSquare size={32} />
            </div>
            <h3 className="messages-no-chat-heading">Select a Conversation</h3>
            <p className="messages-no-chat-sub">
              Choose an active deal from the left sidebar to review terms and coordinate directly with buyers or farmers.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default MessagesPage;
