import React, { useState, useEffect, useRef } from 'react';
import './ChatCenter.css';

const ChatCenter = ({ userRole, userId }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('conversations'); // 'conversations' or 'users'
  const [conversations, setConversations] = useState([]);
  const [allUsers, setAllUsers] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [conversationSearch, setConversationSearch] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [editingMessage, setEditingMessage] = useState(null);
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [showMessageOptions, setShowMessageOptions] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState(null);
  
  // Real-time polling
  const pollInterval = useRef(null);
  const messagePollInterval = useRef(null);
  const typingTimeout = useRef(null);
  const initialLoadComplete = useRef(false);

  // Listen for token changes
  useEffect(() => {
    const handleStorageChange = () => {
      const newToken = localStorage.getItem('token');
      setToken(newToken);
      setIsAuthenticated(!!newToken);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    if (userId && token && isAuthenticated && !initialLoadComplete.current) {
      Promise.all([
        fetchConversations(),
        fetchAllUsers(),
        fetchUnreadCount()
      ]).finally(() => {
        initialLoadComplete.current = true;
      });
    }
    
    // Cleanup polling on unmount
    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
      if (messagePollInterval.current) {
        clearInterval(messagePollInterval.current);
      }
    };
  }, [userId, token, isAuthenticated]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const chatContainer = document.querySelector('.chat-center-container');
      if (chatContainer && !chatContainer.contains(event.target)) {
        setIsOpen(false);
        // Stop polling when closed
        if (pollInterval.current) {
          clearInterval(pollInterval.current);
        }
        if (messagePollInterval.current) {
          clearInterval(messagePollInterval.current);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages();
      // Start polling for messages in current conversation
      startMessagePolling();
    } else {
      // Stop message polling when no user selected
      if (messagePollInterval.current) {
        clearInterval(messagePollInterval.current);
      }
    }
  }, [selectedUser]);

  // Start polling for conversations and unread count - only when chat is open
  const startPolling = () => {
    if (pollInterval.current) {
      clearInterval(pollInterval.current);
    }
    
    pollInterval.current = setInterval(() => {
      if (userId && isOpen && token && isAuthenticated) {
        fetchConversations();
        fetchUnreadCount();
      }
    }, 5000); // Poll every 5 seconds
  };

  // Start polling for messages in current conversation
  const startMessagePolling = () => {
    if (messagePollInterval.current) {
      clearInterval(messagePollInterval.current);
    }
    
    if (selectedUser && isOpen && token && isAuthenticated) {
      messagePollInterval.current = setInterval(() => {
        fetchMessages();
      }, 3000); // Poll messages every 3 seconds
    }
  };

  const fetchConversations = async () => {
    try {
      if (!token || !isAuthenticated) {
        console.log('No token or not authenticated, skipping conversation fetch');
        return;
      }
      
      const response = await fetch(`http://localhost:5000/api/chat/conversations/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      } else if (response.status === 401) {
        console.log('Token expired or invalid');
        // The auth context will handle logout
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      if (!token || !isAuthenticated) return;
      
      const response = await fetch(`http://localhost:5000/api/chat/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAllUsers(data.users || {});
      }
    } catch (error) {
      console.error('Error fetching all users:', error);
    }
  };

  const fetchMessages = async () => {
    if (!selectedUser) return;
    
    try {
      setMessageLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/chat/messages/${userId}/${selectedUser._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        markMessagesAsRead();
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setMessageLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      if (!token || !isAuthenticated) return;
      
      const response = await fetch(`http://localhost:5000/api/chat/${userId}/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markMessagesAsRead = async () => {
    if (!selectedUser) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/chat/${userId}/${selectedUser._id}/mark-read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Update conversations to remove unread count
      setConversations(prev => 
        prev.map(conv => 
          conv._id === selectedUser._id 
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    try {
      const response = await fetch('http://localhost:5000/api/chat/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender_id: userId,
          receiver_id: selectedUser._id,
          message: newMessage.trim(),
          reply_to: replyToMessage?._id
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data.chat]);
        setNewMessage('');
        setReplyToMessage(null);
        fetchConversations(); // Refresh conversations
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const editMessage = async (messageId, newContent) => {
    try {
      const response = await fetch(`http://localhost:5000/api/chat/edit/${messageId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: newContent })
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(prev => 
          prev.map(msg => msg._id === messageId ? data.chat : msg)
        );
        setEditingMessage(null);
      }
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  const addReaction = async (messageId, emoji) => {
    try {
      const response = await fetch(`http://localhost:5000/api/chat/reaction/${messageId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id: userId, emoji })
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(prev => 
          prev.map(msg => msg._id === messageId ? data.chat : msg)
        );
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const searchMessages = async () => {
    if (!messageSearchQuery.trim() || !selectedUser) return;

    try {
      const response = await fetch(`http://localhost:5000/api/chat/search/${userId}/${selectedUser._id}?query=${encodeURIComponent(messageSearchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.messages || []);
        setShowMessageSearch(true);
      }
    } catch (error) {
      console.error('Error searching messages:', error);
    }
  };

  const handleMessageClick = (messageId) => {
    if (selectedMessageId === messageId) {
      setSelectedMessageId(null);
      setShowMessageOptions(false);
    } else {
      setSelectedMessageId(messageId);
      setShowMessageOptions(true);
    }
  };

  const handleEditMessage = (messageId) => {
    const message = messages.find(msg => msg._id === messageId);
    if (message) {
      setEditingMessage(message);
      setNewMessage(message.message);
    }
    setSelectedMessageId(null);
    setShowMessageOptions(false);
  };

  const handleDeleteMessage = (messageId) => {
    deleteMessage(messageId);
    setSelectedMessageId(null);
    setShowMessageOptions(false);
  };

  const closeMessageOptions = () => {
    setSelectedMessageId(null);
    setShowMessageOptions(false);
  };

  // Close message options when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMessageOptions && !event.target.closest('.modern-message-options') && !event.target.closest('.modern-message-bubble')) {
        closeMessageOptions();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMessageOptions]);

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    // Update typing status
    if (!isTyping) {
      setIsTyping(true);
      updateTypingStatus(true);
    }
    
    // Clear existing timeout
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
    
    // Set new timeout to stop typing
    typingTimeout.current = setTimeout(() => {
      setIsTyping(false);
      updateTypingStatus(false);
    }, 1000);
  };

  const updateTypingStatus = async (typing) => {
    if (!selectedUser) return;
    
    try {
      await fetch('http://localhost:5000/api/chat/typing', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          otherUserId: selectedUser._id,
          isTyping: typing
        })
      });
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  };

  const deleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/chat/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setMessages(prev => prev.filter(msg => msg._id !== messageId));
        fetchConversations(); // Refresh conversations
        console.log('Message deleted successfully');
      } else {
        console.error('Failed to delete message');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const deleteConversation = async (conversationUserId) => {
    if (!window.confirm('Are you sure you want to delete this entire conversation? This action cannot be undone.')) {
      return;
    }

    try {
      // Get all messages in this conversation
      const conversationMessages = await fetch(`http://localhost:5000/api/chat/messages/${userId}/${conversationUserId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (conversationMessages.ok) {
        const data = await conversationMessages.json();
        const messages = data.messages || [];

        // Delete all messages in the conversation
        const deletePromises = messages.map(message => 
          fetch(`http://localhost:5000/api/chat/${message._id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        );

        await Promise.all(deletePromises);
        
        // Update state
        setConversations(prev => prev.filter(conv => conv._id !== conversationUserId));
        
        // If this conversation was selected, close it
        if (selectedUser && selectedUser._id === conversationUserId) {
          setSelectedUser(null);
          setMessages([]);
        }
        
        fetchConversations(); // Refresh conversations
        console.log('Conversation deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const deleteFullChat = async (chatUserId) => {
    if (!window.confirm('Are you sure you want to delete this entire chat? This action cannot be undone.')) {
      return;
    }

    try {
      // Get all messages in this chat
      const chatMessages = await fetch(`http://localhost:5000/api/chat/messages/${userId}/${chatUserId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (chatMessages.ok) {
        const data = await chatMessages.json();
        const messages = data.messages || [];

        // Delete all messages in the chat
        const deletePromises = messages.map(message => 
          fetch(`http://localhost:5000/api/chat/${message._id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        );

        await Promise.all(deletePromises);
        
        // Update state
        setConversations(prev => prev.filter(conv => conv._id !== chatUserId));
        
        // Close the chat
        setSelectedUser(null);
        setMessages([]);
        
        fetchConversations(); // Refresh conversations
        console.log('Full chat deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting full chat:', error);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const toggleDropdown = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    
    if (newIsOpen) {
      // Close any open notification dropdowns
      const notificationDropdowns = document.querySelectorAll('.notification-dropdown');
      notificationDropdowns.forEach(dropdown => {
        dropdown.style.display = 'none';
      });
      
      Promise.all([
        fetchConversations(),
        fetchAllUsers(),
        fetchUnreadCount()
      ]).finally(() => {
        startPolling();
      });
    } else {
      // Stop polling when chat is closed
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
      if (messagePollInterval.current) {
        clearInterval(messagePollInterval.current);
      }
    }
  };

  const selectUser = (user) => {
    setSelectedUser(user);
  };

  const closeChat = () => {
    setSelectedUser(null);
    setMessages([]);
  };

  const startNewChat = (user) => {
    setSelectedUser(user);
    setActiveTab('conversations');
  };

  const getFilteredUsers = () => {
    const filtered = {};
    Object.keys(allUsers).forEach(role => {
      filtered[role] = allUsers[role].filter(user => 
        user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearch.toLowerCase())
      );
    });
    return filtered;
  };

  const getFilteredConversations = () => {
    if (!conversationSearch.trim()) return conversations;
    return conversations.filter(conv => 
      conv.user.name.toLowerCase().includes(conversationSearch.toLowerCase()) ||
      conv.user.email.toLowerCase().includes(conversationSearch.toLowerCase()) ||
      conv.lastMessage.message.toLowerCase().includes(conversationSearch.toLowerCase())
    );
  };

  const getRoleColor = (role) => {
    const colors = {
      Admin: '#e74c3c',
      Teacher: '#3498db',
      Student: '#2ecc71',
      Parent: '#f39c12',
      Counsellor: '#9b59b6'
    };
    return colors[role] || '#95a5a6';
  };

  return (
    <div className="chat-center-container">
      <button 
        className="chat-envelope-btn" 
        onClick={toggleDropdown}
        title="Messages"
      >
        <span className="chat-envelope-icon">💬</span>
        {unreadCount > 0 && (
          <span className="chat-envelope-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="chat-dropdown">
          {!selectedUser ? (
            // Main chat interface with tabs
            <div className="chat-main-interface">
              <div className="chat-header">
                <div className="chat-header-content">
                  <h3 className="chat-header-title">Chat Center</h3>
                  <div className="chat-header-actions">
                    <button 
                      className="chat-new-chat-btn"
                      onClick={() => setActiveTab('users')}
                      title="Start New Chat"
                    >
                      +
                    </button>
                    <button 
                      className="chat-close-btn"
                      onClick={() => setIsOpen(false)}
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>

              <div className="chat-content">
                {activeTab === 'users' ? (
                  // Users list for starting new chat
                  <div className="chat-users">
                    <div className="chat-users-header">
                      <button 
                        className="chat-back-btn"
                        onClick={() => setActiveTab('conversations')}
                      >
                        ← Back to Conversations
                      </button>
                    </div>
                    <div className="chat-search-bar">
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="chat-search-input"
                      />
                    </div>
                    <div className="chat-users-content">
                      {Object.keys(getFilteredUsers()).map(role => (
                        <div key={role} className="chat-role-section">
                          <div 
                            className="chat-role-header"
                            style={{ color: getRoleColor(role) }}
                          >
                            {role}s ({getFilteredUsers()[role].length})
                          </div>
                          <div className="chat-users-list">
                            {getFilteredUsers()[role].map(user => (
                              <div
                                key={user._id}
                                className="chat-user-item"
                                onClick={() => selectUser(user)}
                              >
                                <div 
                                  className="chat-user-avatar"
                                  style={{ backgroundColor: getRoleColor(role) }}
                                >
                                  {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="chat-user-info">
                                  <div className="chat-user-name">{user.name}</div>
                                  <div className="chat-user-role">{role}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  // Conversations list (default)
                  <div className="chat-conversations">
                    <div className="chat-search-bar">
                      <input
                        type="text"
                        placeholder="Search conversations..."
                        value={conversationSearch}
                        onChange={(e) => setConversationSearch(e.target.value)}
                        className="chat-search-input"
                      />
                    </div>
                    {getFilteredConversations().length === 0 ? (
                      <div className="chat-empty">
                        <div className="chat-empty-icon">💬</div>
                        <div className="chat-empty-text">
                          {conversationSearch ? 'No matching conversations' : 'No conversations yet'}
                        </div>
                        <div className="chat-empty-subtitle">
                          {conversationSearch ? 'Try a different search' : 'Start a new chat!'}
                        </div>
                      </div>
                    ) : (
                      <div className="chat-conversations-list">
                        {getFilteredConversations().map((conversation) => (
                          <div
                            key={conversation._id}
                            className={`modern-chat-item ${selectedUser && selectedUser._id === conversation.user._id ? 'modern-chat-active' : ''}`}
                            onClick={() => selectUser(conversation.user)}
                          >
                            <div className="modern-chat-content">
                              <div className="modern-chat-header">
                                <span className="modern-chat-name">
                                  {conversation.user.name}
                                </span>
                                <span className="modern-chat-time">
                                  {formatTime(conversation.lastMessage.sent_at)}
                                </span>
                              </div>
                              <div className="modern-chat-preview">
                                {conversation.lastMessage.message}
                              </div>
                            </div>
                            <div className="modern-chat-actions">
                              {conversation.unreadCount > 0 && (
                                <div className="modern-chat-badge">
                                  {conversation.unreadCount}
                                </div>
                              )}
                              <button 
                                className="modern-conversation-delete-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteFullChat(conversation.user._id);
                                }}
                                title="Delete conversation"
                              >
                                🗑️
                              </button>
                              {selectedUser && selectedUser._id === conversation.user._id && (
                                <div className="modern-chat-arrow">→</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Chat interface
            <div className="chat-interface">
              <div className="modern-chat-header">
                <button 
                  className="modern-back-btn"
                  onClick={closeChat}
                >
                  ←
                </button>
                <div className="modern-chat-user-info">
                  <span className="modern-chat-user-name">{selectedUser.name}</span>
                  <div className="modern-chat-status">
                    <div className="modern-status-dot"></div>
                    <span className="modern-status-text">Active now</span>
                  </div>
                </div>
                <div className="modern-chat-actions">
                  <button 
                    className="modern-info-btn"
                    onClick={() => alert('User Info: ' + selectedUser.name)}
                  >
                    i
                  </button>
                </div>
              </div>

              {showMessageSearch && (
                <div className="chat-search-overlay">
                  <div className="chat-search-header">
                    <input
                      type="text"
                      placeholder="Search messages..."
                      value={messageSearchQuery}
                      onChange={(e) => setMessageSearchQuery(e.target.value)}
                      className="chat-search-input"
                    />
                    <button 
                      className="chat-search-btn"
                      onClick={searchMessages}
                    >
                      Search
                    </button>
                    <button 
                      className="chat-search-close"
                      onClick={() => setShowMessageSearch(false)}
                    >
                      ×
                    </button>
                  </div>
                  {searchResults.length > 0 && (
                    <div className="chat-search-results">
                      {searchResults.map((message) => (
                        <div 
                          key={message._id}
                          className="chat-search-result"
                          onClick={() => {
                            setShowMessageSearch(false);
                            setSearchResults([]);
                          }}
                        >
                          <div className="chat-search-result-text">{message.message}</div>
                          <div className="chat-search-result-time">{formatTime(message.sent_at)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="chat-interface-messages">
                {messageLoading ? (
                  <div className="chat-loading">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="chat-empty">
                    <div className="chat-empty-icon">💬</div>
                    <div className="chat-empty-text">No messages yet</div>
                    <div className="chat-empty-subtitle">Start the conversation!</div>
                  </div>
                ) : (
                  <div className="modern-messages-list">
                    {messages.map((message) => (
                      <div 
                        key={message._id}
                        className={`modern-message ${message.sender_id._id === userId ? 'modern-message-sent' : 'modern-message-received'}`}
                      >
                        <div 
                          className="modern-message-bubble"
                          onClick={() => handleMessageClick(message._id)}
                        >
                          <div className="modern-message-content">
                            <div className="modern-message-text">
                              {message.message}
                            </div>
                            <div className="modern-message-time">
                              {formatTime(message.sent_at)}
                              {message.read_status && (
                                <span className="modern-read-indicator">✓</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Message Options */}
                        {selectedMessageId === message._id && showMessageOptions && (
                          <div className="modern-message-options">
                            <button 
                              className="modern-message-option-btn modern-edit-btn"
                              onClick={() => handleEditMessage(message._id)}
                            >
                              ✏️ Edit
                            </button>
                            <button 
                              className="modern-message-option-btn modern-delete-btn"
                              onClick={() => handleDeleteMessage(message._id)}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <form className="modern-chat-input" onSubmit={sendMessage}>
                <div className="modern-input-container">
                  <div className="modern-input-icons">
                    <button type="button" className="modern-input-icon" title="Emoji">😊</button>
                  </div>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={handleTyping}
                    placeholder="Type message..."
                    className="modern-message-input"
                  />
                  <button 
                    type="submit"
                    className="modern-send-btn"
                    disabled={!newMessage.trim()}
                  >
                    ✈️
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatCenter;
