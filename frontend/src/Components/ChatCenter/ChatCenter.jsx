import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import './ChatCenter.css';

const API_BASE = 'http://localhost:5000/api/chat';
const ROLE_COLORS = { Admin: '#ef4444', Teacher: '#3b82f6', Student: '#10b981', Parent: '#f59e0b', Counsellor: '#8b5cf6' };
const ROLE_ORDER = ['Admin', 'Teacher', 'Student', 'Parent', 'Counsellor'];
const EMPTY_USERS = { Admin: [], Teacher: [], Student: [], Parent: [], Counsellor: [] };

const ChatCenter = ({ userRole, userId: propUserId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState(EMPTY_USERS);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserSelection, setShowUserSelection] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [userFetchError, setUserFetchError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newMessageNotification, setNewMessageNotification] = useState(null);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const userId = propUserId || (() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.id || user._id;
    } catch {
      return null;
    }
  })();

  const getToken = () => localStorage.getItem('token');
  const getId = (obj) => obj?._id || obj?.id || obj;
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.charAt(0).toUpperCase();
  };
  const getRoleColor = (role) => ROLE_COLORS[role] || '#64748b';

  const fetchUsers = useCallback(async () => {
    if (!userId || !getToken()) { setUsers(EMPTY_USERS); return; }
    try {
      setLoading(true);
      setUserFetchError(null);
      const response = await fetch(`${API_BASE}/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (!response.ok) {
        setUserFetchError('Failed to load users. Please check if backend is running.');
        setUsers(EMPTY_USERS);
        return;
      }
      const data = await response.json();
      setUsers(data.users || EMPTY_USERS);
    } catch {
      setUserFetchError('Cannot connect to server. Please make sure the backend is running.');
      setUsers(EMPTY_USERS);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchMessages = useCallback(async () => {
    if (!selectedUser || !userId) return;
    try {
      const response = await fetch(`${API_BASE}/messages/${userId}/${selectedUser._id}?limit=50`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await response.json();
      setMessages(data.messages || []);
    } catch {
      setMessages([]);
    }
  }, [selectedUser, userId]);

  const fetchConversations = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await fetch(`${API_BASE}/conversations/${userId}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await response.json();
      setConversations(data.conversations || []);
      const totalUnread = (data.conversations || []).reduce((sum, conversation) => sum + (conversation.unreadCount || 0), 0);
      setUnreadCount(totalUnread);
    } catch {
      setConversations([]);
    }
  }, [userId]);

  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await fetch(`${API_BASE}/${userId}/unread-count`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await response.json();
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // Silent fail
    }
  }, [userId]);

  const markMessagesAsRead = useCallback(async () => {
    if (!selectedUser || !userId) return;
    try {
      await fetch(`${API_BASE}/${userId}/${selectedUser._id}/mark-read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      fetchConversations();
      fetchUnreadCount();
    } catch {
      // Silent fail
    }
  }, [selectedUser, userId, fetchConversations, fetchUnreadCount]);

  useEffect(() => {
    if (!userId || !getToken()) return;
    if (!socketRef.current) {
      socketRef.current = io('http://localhost:5000', { 
        auth: { token: getToken() }, 
        transports: ['websocket', 'polling'],
        autoConnect: true
      });
    } else if (!socketRef.current.connected) {
      socketRef.current.connect();
    }
  }, [userId]);

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!userId || !getToken() || !socketRef.current) return;
    const socket = socketRef.current;

    const handleReceive = (message) => {
      const selectedId = getId(selectedUser);
      const senderId = getId(message.sender_id);
      const receiverId = getId(message.receiver_id);
      const currentUserId = userId?.toString();
      
      if (senderId?.toString() === currentUserId) return;
      
      const isReceiver = receiverId?.toString() === currentUserId;
      const isFromSelectedUser = selectedUser && senderId?.toString() === selectedId?.toString();
      
      if (isReceiver && isFromSelectedUser && isOpen && selectedUser) {
        setMessages(prev => {
          const msgId = getId(message);
          if (prev.some(msg => getId(msg) === msgId)) return prev;
          return [...prev, message];
        });
        markMessagesAsRead();
      } else if (isReceiver) {
        const senderName = (typeof message.sender_id === 'object' ? message.sender_id?.name : null) || 'Someone';
        setNewMessageNotification({ message: `${senderName}: ${message.message}`, senderId });
        setTimeout(() => setNewMessageNotification(null), 5000);
        setUnreadCount(prev => prev + 1);
      }
      setTimeout(() => fetchConversations(), 100);
    };

    const handleSent = (message) => {
      const selectedId = getId(selectedUser);
      const receiverId = getId(message.receiver_id);
      if (selectedUser && receiverId?.toString() === selectedId?.toString()) {
        setMessages(prev => {
          const msgId = getId(message);
          if (prev.some(msg => getId(msg) === msgId)) return prev;
          const filtered = prev.filter(msg => !msg._id?.toString().startsWith('temp_'));
          return [...filtered, message];
        });
      }
      setTimeout(() => fetchConversations(), 100);
    };

    const handleDeleted = ({ messageId }) => {
      setMessages(prev => prev.filter(msg => getId(msg) !== messageId));
    };

    const setupListeners = () => {
      if (!socket) return;
      socket.off('receive_message');
      socket.off('message_sent');
      socket.off('message_deleted');
      socket.on('receive_message', handleReceive);
      socket.on('message_sent', handleSent);
      socket.on('message_deleted', handleDeleted);
    };

    if (socket.connected) {
      setupListeners();
    } else {
      const connectHandler = () => setupListeners();
      socket.once('connect', connectHandler);
      if (!socket.connected) socket.connect();
    }

    return () => {
      if (socket) {
        socket.off('receive_message', handleReceive);
        socket.off('message_sent', handleSent);
        socket.off('message_deleted', handleDeleted);
      }
    };
  }, [userId, selectedUser, isOpen, markMessagesAsRead, fetchConversations]);

  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }));
    }
  }, [messages]);

  useEffect(() => {
    if (!isOpen || !userId) return;
    if (showUserSelection) fetchUsers();
    else if (!selectedUser) fetchConversations();
  }, [isOpen, userId, selectedUser, showUserSelection, fetchUsers, fetchConversations]);

  useEffect(() => {
    if (!userId) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, [userId, fetchUnreadCount]);

  useEffect(() => {
    if (selectedUser && userId) {
      fetchMessages();
      markMessagesAsRead();
      setShowUserSelection(false);
    }
  }, [selectedUser, userId, fetchMessages, markMessagesAsRead]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !userId) return;
    const messageText = newMessage.trim();
    setNewMessage('');

    const tempMessage = {
      _id: `temp_${Date.now()}`,
      sender_id: userId,
      receiver_id: selectedUser._id,
      message: messageText,
      sent_at: new Date().toISOString(),
      read_status: false
    };
    setMessages(prev => [...prev, tempMessage]);

    if (socketRef.current?.connected) {
      socketRef.current.emit('send_message', { sender_id: userId, receiver_id: selectedUser._id, message: messageText });
      setTimeout(() => fetchConversations(), 200);
    } else {
      try {
        await fetch(`${API_BASE}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
          body: JSON.stringify({ sender_id: userId, receiver_id: selectedUser._id, message: messageText, sender_role: userRole })
        });
        fetchMessages();
        fetchConversations();
      } catch {
        setMessages(prev => prev.filter(msg => msg._id !== tempMessage._id));
      }
    }
  };

  const deleteMessage = async (messageId) => {
    if (!messageId || !userId || !window.confirm('Are you sure you want to delete this message?')) return;
    if (socketRef.current?.connected) {
      socketRef.current.emit('delete_message', { messageId, userId });
    } else {
      try {
        const response = await fetch(`${API_BASE}/${messageId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        if (response.ok) {
          setMessages(prev => prev.filter(msg => getId(msg) !== messageId));
        }
      } catch {
        // Silent fail
      }
    }
  };

  const deleteConversation = async (otherUserId) => {
    if (!userId || !otherUserId || !window.confirm('Are you sure you want to delete this conversation?')) return;
    try {
      const response = await fetch(`${API_BASE}/conversation/${userId}/${otherUserId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (response.ok) {
        fetchConversations();
        if (selectedUser && getId(selectedUser) === getId(otherUserId)) {
          setSelectedUser(null);
        }
      } else {
        alert('Failed to delete conversation');
      }
    } catch {
      alert('Error deleting conversation');
    }
  };

  const getFilteredUsers = () => {
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase();
    const filtered = {};
    Object.keys(users).forEach(role => {
      filtered[role] = users[role].filter(user => user.name?.toLowerCase().includes(query));
    });
    return filtered;
  };

  const getFilteredConversations = () => {
    if (!searchQuery.trim()) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter(conversation => conversation.user.name?.toLowerCase().includes(query));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleBackToConversations = () => {
    setSelectedUser(null);
    setShowUserSelection(false);
    setSearchQuery('');
  };

  const handleNewChat = () => {
    setShowUserSelection(true);
    setSelectedUser(null);
    setSearchQuery('');
  };

  const renderUserList = () => {
    const filteredUsers = getFilteredUsers();
    const hasResults = Object.values(filteredUsers).some(arr => arr.length > 0);
    if (searchQuery.trim() && !hasResults) {
      return <div className="cc-empty-users-message"><p>No users found</p></div>;
    }
    return ROLE_ORDER.map(role => {
      const roleUsers = filteredUsers[role] || [];
      const totalCount = (users[role] || []).length;
      if (searchQuery.trim() && roleUsers.length === 0) return null;
      return (
        <div key={role} className="cc-role-category-section">
          <h4 className="cc-role-category-title" style={{ color: getRoleColor(role) }}>
            {role.toUpperCase()}S ({searchQuery.trim() ? roleUsers.length : totalCount})
          </h4>
          {roleUsers.map(user => (
            <div key={user._id} className="cc-user-card-item" onClick={() => setSelectedUser(user)}>
              <div className="cc-user-avatar-circle" style={{ background: getRoleColor(user.role || role) }}>
                {getInitials(user.name)}
              </div>
              <div className="cc-user-info-wrapper">
                <div className="cc-user-name-bold">{user.name || 'Unknown'}</div>
                <div className="cc-user-role-label">{user.role || role}</div>
              </div>
            </div>
          ))}
        </div>
      );
    });
  };

  const renderMessages = () => {
    if (messages.length === 0) {
      return (
        <div className="cc-empty-state-container">
          <div className="cc-empty-icon-bubble">💬</div>
          <h3 className="cc-empty-title-text">No messages yet</h3>
          <p className="cc-empty-subtitle-text">Start the conversation!</p>
        </div>
      );
    }
    const visibleMessages = messages.filter(msg => !msg.is_deleted);
    return (
      <div className="cc-messages-list-wrapper">
        {visibleMessages.map((message, index) => {
          const messageId = getId(message);
          const senderId = getId(message.sender_id);
          const isSent = senderId === userId;
          const messageDate = new Date(message.sent_at || message.timestamp);
          const prevDate = index > 0 ? new Date(visibleMessages[index - 1].sent_at || visibleMessages[index - 1].timestamp) : null;
          const showDate = !prevDate || messageDate.toDateString() !== prevDate.toDateString();
          return (
            <React.Fragment key={messageId || index}>
              {showDate && (
                <div className="cc-date-divider-line">
                  <span className="cc-date-divider-text">
                    {messageDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
              )}
              <div className={`cc-message-item-wrapper ${isSent ? 'cc-message-sent-right' : 'cc-message-received-left'}`}>
                <div className={`cc-message-bubble-container ${isSent ? 'cc-bubble-sent-style' : 'cc-bubble-received-style'}`}>
                  <div className="cc-message-text-content">{message.message}</div>
                  <div className="cc-message-meta-info">
                    <span className="cc-message-time-text">
                      {messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isSent && (
                      <>
                        <span className="cc-message-status-icons">✓✓</span>
                        <button className="cc-message-delete-btn" onClick={() => deleteMessage(messageId)} title="Delete message">🗑️</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    );
  };

  if (!userId) return null;

  return (
    <div className="cc-main-container">
      {newMessageNotification && (
        <div className="cc-new-message-notification" onClick={() => setIsOpen(true)}>
          <div className="cc-notification-content">
            <span className="cc-notification-icon">💬</span>
            <span className="cc-notification-text">{newMessageNotification.message}</span>
          </div>
          <button className="cc-notification-close" onClick={(e) => { e.stopPropagation(); setNewMessageNotification(null); }}>×</button>
        </div>
      )}

      <button className="cc-toggle-button" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle chat">
        💬
        {unreadCount > 0 && <span className="cc-unread-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      {isOpen && (
        <div className={`cc-window-main ${selectedUser ? 'cc-window-chat-open' : (showUserSelection ? 'cc-window-user-selection' : 'cc-window-empty-state')}`}>
          {!selectedUser && !showUserSelection && (
            <div className="cc-conversations-main-view">
              <div className="cc-header-purple-bar">
                <h2 className="cc-header-title-text">Chat Center</h2>
                <div className="cc-header-buttons-wrapper">
                  <button className="cc-header-action-button" onClick={handleNewChat} aria-label="New chat">+</button>
                  <button className="cc-header-action-button" onClick={() => setIsOpen(false)} aria-label="Close chat">×</button>
                </div>
              </div>
              <div className="cc-search-wrapper">
                <input type="text" className="cc-search-input-field" placeholder="Search conversations..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <div className="cc-conversations-list-area">
                {loading ? (
                  <div className="cc-loading-text">Loading conversations...</div>
                ) : conversations.length === 0 ? (
                  <div className="cc-empty-state-container">
                    <div className="cc-empty-icon-bubble">💬</div>
                    <h3 className="cc-empty-title-text">No conversations yet</h3>
                    <p className="cc-empty-subtitle-text">Start a new chat!</p>
                  </div>
                ) : (
                  <div className="cc-conversations-list">
                    {getFilteredConversations().map(conversation => (
                      <div key={conversation._id} className="cc-conversation-item" onClick={() => setSelectedUser(conversation.user)}>
                        <div className="cc-conversation-avatar" style={{ background: getRoleColor(conversation.user.role) }}>
                          {getInitials(conversation.user.name)}
                        </div>
                        <div className="cc-conversation-info">
                          <div className="cc-conversation-header">
                            <div className="cc-conversation-name">
                              {conversation.user.name || 'Unknown'}
                              {conversation.unreadCount > 0 && <span className="cc-conversation-unread-badge">{conversation.unreadCount}</span>}
                            </div>
                            <button className="cc-conversation-delete-btn" onClick={(e) => { e.stopPropagation(); deleteConversation(conversation.user._id); }} aria-label="Delete conversation">🗑️</button>
                          </div>
                          <div className="cc-conversation-preview">{conversation.lastMessage?.message || 'No messages'}</div>
                          <div className="cc-conversation-meta">
                            <span className="cc-conversation-role">{conversation.user.role}</span>
                            {conversation.lastMessage?.sent_at && (
                              <span className="cc-conversation-time">{new Date(conversation.lastMessage.sent_at).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {showUserSelection && (
            <div className="cc-user-selection-full-view">
              <div className="cc-header-purple-bar">
                <h2 className="cc-header-title-text">Chat Center</h2>
                <div className="cc-header-buttons-wrapper">
                  <button className="cc-header-action-button" onClick={handleNewChat} aria-label="New chat">+</button>
                  <button className="cc-header-action-button" onClick={() => setIsOpen(false)} aria-label="Close chat">×</button>
                </div>
              </div>
              <div className="cc-back-button-container">
                <button className="cc-back-button-purple" onClick={handleBackToConversations}>← Back to Conversations</button>
              </div>
              <div className="cc-search-wrapper">
                <input type="text" className="cc-search-input-field" placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <div className="cc-users-list-scrollable">
                {userFetchError && (
                  <div className="cc-error-message" style={{ padding: '16px', color: '#ef4444', textAlign: 'center' }}>{userFetchError}</div>
                )}
                {loading ? <div className="cc-loading-text">Loading users...</div> : renderUserList()}
              </div>
            </div>
          )}

          {selectedUser && (
            <div className="cc-chat-full-view">
              <div className="cc-header-purple-bar">
                <div className="cc-header-left-section">
                  <button className="cc-back-arrow-button" onClick={() => setSelectedUser(null)} aria-label="Back">←</button>
                  <h2 className="cc-header-title-text">Chat Center</h2>
                </div>
                <div className="cc-header-buttons-wrapper">
                  <button className="cc-header-action-button" onClick={handleNewChat} aria-label="New chat">+</button>
                  <button className="cc-header-action-button" onClick={() => setIsOpen(false)} aria-label="Close chat">×</button>
                </div>
              </div>
              <div className="cc-chat-main-area">
                <div className="cc-chat-header-bar">
                  <div className="cc-chat-header-user-info">
                    <div className="cc-chat-header-avatar-circle">{getInitials(selectedUser.name)}</div>
                    <div className="cc-chat-header-info-wrapper">
                      <h3 className="cc-chat-header-name-text">{selectedUser.name || 'Unknown'}</h3>
                      <div className="cc-chat-header-status-wrapper">
                        <span className="cc-status-dot-green"></span>
                        <span>Active now</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="cc-messages-scroll-container">{renderMessages()}</div>
                <div className="cc-input-area-container">
                  <button className="cc-emoji-button-icon" aria-label="Add emoji">😊</button>
                  <input type="text" className="cc-message-input-field" placeholder="Type message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={handleKeyPress} />
                  <button className="cc-send-button-circle" onClick={sendMessage} aria-label="Send message">➤</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatCenter;
