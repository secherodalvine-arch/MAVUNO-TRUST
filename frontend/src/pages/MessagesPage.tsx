import React, { useState, useEffect, useRef } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { getConversations, getMessages, sendMessage } from '../services/chatService';
import type { ConversationDTO, MessageDTO } from '../services/chatService';
import { socketService } from '../services/socketService';
import { useLocation } from 'react-router-dom';
import { Lock } from 'lucide-react';

export const MessagesPage: React.FC = () => {
  const { user, accessToken } = useAuthContext();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialConversationId = queryParams.get('conversationId');

  const [conversations, setConversations] = useState<ConversationDTO[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(initialConversationId);
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();

    if (accessToken) {
      socketService.connect(accessToken);
      
      socketService.onNewMessage((newMsg: MessageDTO) => {
        setMessages(prev => {
          // Deduplicate based on _id (so REST response + WS event don't duplicate)
          if (prev.some(m => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
      });
    }

    return () => {
      socketService.disconnect();
    };
  }, [accessToken]);

  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId);
      socketService.joinConversation(activeConversationId);
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
      if (data.length > 0 && !activeConversationId) {
        setActiveConversationId(data[0]._id);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error?.message || 'Failed to load conversations.');
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
      alert(err.response?.data?.error?.message || 'Failed to load messages.');
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversationId || !newMessage.trim()) return;

    try {
      const sentMsg = await sendMessage(activeConversationId, newMessage.trim());
      setMessages(prev => [...prev, sentMsg]);
      setNewMessage('');
      
      // Update last message time in conversation list
      setConversations(prev => {
        const copy = [...prev];
        const idx = copy.findIndex(c => c._id === activeConversationId);
        if (idx !== -1) {
          copy[idx] = { ...copy[idx], lastMessageAt: new Date().toISOString() };
          // Move to top
          const [moved] = copy.splice(idx, 1);
          copy.unshift(moved);
        }
        return copy;
      });
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to send message.');
    }
  };

  const activeConversation = conversations.find(c => c._id === activeConversationId);

  if (loading) return <div style={{ padding: '20px' }}>Loading messages...</div>;

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      {/* Sidebar - Conversation List */}
      <div style={{ width: '30%', borderRight: '1px solid #e5e7eb', backgroundColor: '#f9fafb', overflowY: 'auto' }}>
        <h2 style={{ padding: '20px', margin: 0, borderBottom: '1px solid #e5e7eb', fontSize: '1.25rem', color: '#111827' }}>Conversations</h2>
        
        {conversations.length === 0 ? (
          <div style={{ padding: '20px', color: '#6b7280' }}>No conversations yet.</div>
        ) : (
          conversations.map(convo => {
            const counterparty = convo.participants.find(p => p._id !== user?.id);
            const isSelected = activeConversationId === convo._id;
            
            return (
              <div 
                key={convo._id} 
                onClick={() => setActiveConversationId(convo._id)}
                style={{ 
                  padding: '15px 20px', 
                  borderBottom: '1px solid #e5e7eb', 
                  cursor: 'pointer',
                  backgroundColor: isSelected ? '#e0e7ff' : 'transparent',
                  transition: 'background-color 0.2s'
                }}
              >
                <div style={{ fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}>
                  {counterparty?.fullName || 'Unknown User'}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#4b5563' }}>
                  {convo.relatedListingId ? `${convo.relatedListingId.cropName} (${convo.relatedListingId.estimatedQuantity} ${convo.relatedListingId.unit})` : 'Offer Discussion'}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Main Chat Area */}
      <div style={{ width: '70%', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div style={{ padding: '15px 20px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 5px 0', color: '#111827' }}>
                  {activeConversation.participants.find(p => p._id !== user?.id)?.fullName || 'Unknown'}
                </h3>
                {activeConversation.relatedListingId && (
                  <div style={{ fontSize: '0.85rem', color: '#4b5563' }}>
                    <strong>Crop:</strong> {activeConversation.relatedListingId.cropName} | {activeConversation.relatedListingId.estimatedQuantity} {activeConversation.relatedListingId.unit}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontSize: '0.85rem', fontWeight: 'bold', backgroundColor: '#dcfce7', padding: '6px 12px', borderRadius: '20px' }}>
                <Lock size={15} /> Private Chat
              </div>
            </div>

            {/* Message History */}
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', backgroundColor: '#f3f4f6', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {messagesLoading ? (
                <div style={{ textAlign: 'center', color: '#6b7280' }}>Loading messages...</div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#6b7280', marginTop: '20px' }}>
                  No messages yet. Start the conversation.
                </div>
              ) : (
                messages.map(msg => {
                  const isMine = msg.senderId === user?.id;
                  return (
                    <div key={msg._id} style={{ display: 'flex', justifyContent: 'space-between', flexDirection: isMine ? 'row-reverse' : 'row' }}>
                      <div style={{ 
                        maxWidth: '60%', 
                        padding: '12px 16px', 
                        borderRadius: '12px', 
                        backgroundColor: isMine ? '#4f46e5' : '#ffffff',
                        color: isMine ? '#ffffff' : '#111827',
                        border: isMine ? 'none' : '1px solid #e5e7eb',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        borderBottomRightRadius: isMine ? '4px' : '12px',
                        borderBottomLeftRadius: isMine ? '12px' : '4px'
                      }}>
                        <div style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                        <div style={{ fontSize: '0.7rem', marginTop: '6px', textAlign: isMine ? 'right' : 'left', opacity: 0.7 }}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{ padding: '20px', borderTop: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}>
              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message here..."
                  style={{ flex: 1, padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem', outline: 'none' }}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  style={{ 
                    padding: '12px 24px', 
                    backgroundColor: newMessage.trim() ? '#4f46e5' : '#9ca3af', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '8px', 
                    fontWeight: 'bold', 
                    cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                    transition: 'background-color 0.2s'
                  }}
                >
                  Send
                </button>
              </form>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: '1.1rem' }}>
            Select a conversation to start messaging.
          </div>
        )}
      </div>

    </div>
  );
};
