import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ChevronLeft, Send, MessageCircle, User, Store, 
  Package, MoreVertical, Trash2, Search, Check, CheckCheck, Wifi, WifiOff
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { useAuth } from '../contexts/AuthContext';
import { useMessagingWebSocket } from '../hooks/useMessagingWebSocket';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const MessagesPage = () => {
  const { conversationId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typingUsers, setTypingUsers] = useState({}); // {conversationId: {userId: userName}}
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback((data) => {
    switch (data.type) {
      case 'new_message':
        // Add new message to the list if it's for the active conversation
        if (data.conversation_id === activeConversation?.id) {
          setMessages(prev => {
            // Avoid duplicates
            if (prev.find(m => m.id === data.message.id)) return prev;
            return [...prev, data.message];
          });
          scrollToBottom();
        }
        // Update conversation list with new last message
        setConversations(prev => prev.map(conv => {
          if (conv.id === data.conversation_id) {
            return {
              ...conv,
              last_message: {
                content: data.message.content.substring(0, 100),
                sender_id: data.message.sender_id,
                sender_name: data.message.sender_name,
                created_at: data.message.created_at
              },
              updated_at: data.message.created_at,
              unread_count: conv.id === activeConversation?.id ? 0 : (conv.unread_count || 0) + 1
            };
          }
          return conv;
        }));
        break;

      case 'typing':
        // Update typing indicator
        setTypingUsers(prev => {
          const newTyping = { ...prev };
          if (!newTyping[data.conversation_id]) {
            newTyping[data.conversation_id] = {};
          }
          if (data.is_typing) {
            newTyping[data.conversation_id][data.user_id] = data.user_name;
          } else {
            delete newTyping[data.conversation_id][data.user_id];
          }
          return newTyping;
        });
        break;

      case 'read_receipt':
        // Update message read status
        if (data.conversation_id === activeConversation?.id) {
          setMessages(prev => prev.map(msg => {
            if (data.message_ids.includes(msg.id)) {
              return { ...msg, read: true };
            }
            return msg;
          }));
        }
        break;

      case 'status':
        // Update online status
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          if (data.is_online) {
            newSet.add(data.user_id);
          } else {
            newSet.delete(data.user_id);
          }
          return newSet;
        });
        break;

      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  }, [activeConversation?.id]);

  // WebSocket connection
  const { isConnected, sendTyping, sendReadReceipt } = useMessagingWebSocket(
    user?.id,
    handleWebSocketMessage
  );

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const response = await axios.get(`${API}/messages/conversations`);
      setConversations(response.data);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  };

  // Fetch messages for active conversation
  const fetchMessages = async (convId) => {
    try {
      const response = await axios.get(`${API}/messages/conversations/${convId}/messages`);
      setMessages(response.data);
      scrollToBottom();
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  // Start conversation with vendor (from product page)
  const startVendorConversation = async (vendorId, productId) => {
    try {
      const response = await axios.get(`${API}/messages/vendor/${vendorId}/start`, {
        params: { product_id: productId }
      });
      setActiveConversation(response.data);
      navigate(`/messages/${response.data.id}`);
      await fetchMessages(response.data.id);
      await fetchConversations();
    } catch (error) {
      toast.error('Failed to start conversation');
    }
  };

  // Initial load
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const init = async () => {
      setLoading(true);
      await fetchConversations();
      
      // Check if starting new conversation from product/vendor
      const vendorId = searchParams.get('vendor');
      const productId = searchParams.get('product');
      
      if (vendorId) {
        await startVendorConversation(vendorId, productId);
      } else if (conversationId) {
        // Load existing conversation
        try {
          const response = await axios.get(`${API}/messages/conversations/${conversationId}`);
          setActiveConversation(response.data);
          await fetchMessages(conversationId);
        } catch (error) {
          toast.error('Conversation not found');
          navigate('/messages');
        }
      }
      
      setLoading(false);
    };

    init();
  }, [isAuthenticated, conversationId, searchParams]);

  // Handle typing indicator - send typing status when user is typing
  const handleTyping = () => {
    if (!activeConversation) return;
    
    // Send typing indicator
    sendTyping(activeConversation.id, true);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(activeConversation.id, false);
    }, 2000);
  };

  // Get typing indicator text for a conversation
  const getTypingText = (convId) => {
    const typing = typingUsers[convId];
    if (!typing || Object.keys(typing).length === 0) return null;
    const names = Object.values(typing);
    if (names.length === 1) return `${names[0]} is typing...`;
    return `${names.length} people are typing...`;
  };

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [activeConversation]);

  // Scroll when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSelectConversation = async (conv) => {
    setActiveConversation(conv);
    navigate(`/messages/${conv.id}`);
    await fetchMessages(conv.id);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    setSending(true);
    try {
      const recipient = activeConversation.participants.find(p => p.id !== user.id);
      
      await axios.post(`${API}/messages/send`, {
        conversation_id: activeConversation.id,
        recipient_id: recipient.id,
        content: newMessage.trim()
      });
      
      setNewMessage('');
      await fetchMessages(activeConversation.id);
      await fetchConversations();
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteConversation = async (convId) => {
    if (!window.confirm('Are you sure you want to delete this conversation?')) return;
    
    try {
      await axios.delete(`${API}/messages/conversations/${convId}`);
      toast.success('Conversation deleted');
      setConversations(conversations.filter(c => c.id !== convId));
      if (activeConversation?.id === convId) {
        setActiveConversation(null);
        setMessages([]);
        navigate('/messages');
      }
    } catch (error) {
      toast.error('Failed to delete conversation');
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const otherParticipant = conv.participants.find(p => p.id !== user?.id);
    return otherParticipant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           conv.product_name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getOtherParticipant = (conv) => {
    return conv.participants.find(p => p.id !== user?.id);
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border py-4 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Link to="/" className="text-muted-foreground hover:text-primary">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-heading text-xl font-bold">Messages</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="flex h-[calc(100vh-73px)]">
          {/* Conversations List */}
          <div className={`w-full md:w-80 lg:w-96 border-r border-border flex flex-col ${activeConversation ? 'hidden md:flex' : ''}`}>
            {/* Search */}
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="search-conversations"
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-muted-foreground">Loading...</div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">No conversations yet</p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const other = getOtherParticipant(conv);
                  return (
                    <div
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className={`
                        p-4 border-b border-border cursor-pointer transition-colors
                        hover:bg-muted/50
                        ${activeConversation?.id === conv.id ? 'bg-muted' : ''}
                      `}
                      data-testid={`conversation-${conv.id}`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className={other?.role === 'vendor' ? 'bg-primary/10 text-primary' : 'bg-muted'}>
                            {other?.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-semibold truncate">{other?.name}</h3>
                            {conv.unread_count > 0 && (
                              <Badge className="bg-primary">{conv.unread_count}</Badge>
                            )}
                          </div>
                          {conv.product_name && (
                            <p className="text-xs text-primary flex items-center gap-1 mt-0.5">
                              <Package className="h-3 w-3" />
                              {conv.product_name}
                            </p>
                          )}
                          {conv.last_message && (
                            <p className="text-sm text-muted-foreground truncate mt-1">
                              {conv.last_message.sender_id === user?.id && 'You: '}
                              {conv.last_message.content}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className={`flex-1 flex flex-col ${!activeConversation ? 'hidden md:flex' : ''}`}>
            {activeConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border flex items-center justify-between bg-card">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden"
                      onClick={() => {
                        setActiveConversation(null);
                        navigate('/messages');
                      }}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Avatar>
                      <AvatarFallback>
                        {getOtherParticipant(activeConversation)?.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">
                        {getOtherParticipant(activeConversation)?.name}
                      </h3>
                      {activeConversation.product_name && (
                        <Link 
                          to={`/products/${activeConversation.product_id}`}
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <Package className="h-3 w-3" />
                          {activeConversation.product_name}
                        </Link>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => handleDeleteConversation(activeConversation.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Conversation
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
                  {messages.map((msg) => {
                    const isOwn = msg.sender_id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        data-testid={`message-${msg.id}`}
                      >
                        <div className={`
                          max-w-[70%] rounded-2xl px-4 py-2
                          ${isOwn 
                            ? 'bg-primary text-primary-foreground rounded-br-sm' 
                            : 'bg-card border border-border rounded-bl-sm'
                          }
                        `}>
                          <p className="break-words">{msg.content}</p>
                          <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
                            <span className={`text-xs ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isOwn && (
                              msg.read 
                                ? <CheckCheck className="h-3 w-3 text-primary-foreground/70" />
                                : <Check className="h-3 w-3 text-primary-foreground/70" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-card">
                  <div className="flex items-center gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1"
                      disabled={sending}
                      data-testid="message-input"
                    />
                    <Button 
                      type="submit" 
                      size="icon" 
                      className="rounded-full"
                      disabled={!newMessage.trim() || sending}
                      data-testid="send-message-btn"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="font-heading text-lg font-semibold mb-2">Select a conversation</h3>
                  <p className="text-muted-foreground">Choose from your existing conversations or start a new one</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
