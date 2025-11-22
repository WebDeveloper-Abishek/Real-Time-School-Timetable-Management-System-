import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../Components/DashboardLayout/DashboardLayout';
import './TeacherChat.css';

const TeacherChat = () => {
  const [teacherchatChats, setTeacherchatChats] = useState([]);
  const [teacherchatSelectedChat, setTeacherchatSelectedChat] = useState(null);
  const [teacherchatMessages, setTeacherchatMessages] = useState([]);
  const [teacherchatNewMessage, setTeacherchatNewMessage] = useState('');
  const [teacherchatAlerts, setTeacherchatAlerts] = useState([]);

  const teacherchatAddAlert = (message, type = 'success') => {
    const id = Date.now();
    setTeacherchatAlerts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setTeacherchatAlerts(prev => prev.filter(alert => alert.id !== id)), 5000);
  };

  const teacherchatFetchChats = async () => {
    try {
      const response = await fetch('/api/chat/teacher-chats');
      const data = await response.json();
      setTeacherchatChats(data.chats || []);
    } catch (error) {
      teacherchatAddAlert('Error fetching chats', 'error');
    }
  };

  const teacherchatSendMessage = async () => {
    if (!teacherchatNewMessage.trim() || !teacherchatSelectedChat) return;

    try {
      await fetch('/api/chat/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: teacherchatSelectedChat._id,
          message: teacherchatNewMessage,
          sender_role: 'Teacher'
        })
      });
      
      setTeacherchatNewMessage('');
      teacherchatFetchMessages(teacherchatSelectedChat._id);
    } catch (error) {
      teacherchatAddAlert('Error sending message', 'error');
    }
  };

  const teacherchatFetchMessages = async (chatId) => {
    try {
      const response = await fetch(`/api/chat/messages/${chatId}`);
      const data = await response.json();
      setTeacherchatMessages(data.messages || []);
    } catch (error) {
      teacherchatAddAlert('Error fetching messages', 'error');
    }
  };

  useEffect(() => {
    teacherchatFetchChats();
  }, []);

  useEffect(() => {
    if (teacherchatSelectedChat) {
      teacherchatFetchMessages(teacherchatSelectedChat._id);
    }
  }, [teacherchatSelectedChat]);

  const navigationSections = [
    {
      title: 'My Teaching',
      items: [
        { label: 'Teacher Home', icon: '🏠', path: '/teacher/dashboard' },
        { label: 'My Classes', icon: '📚', path: '/teacher/classes' },
        { label: 'Timetable', icon: '📅', path: '/teacher/timetable' },
        { label: 'Students', icon: '🎓', path: '/teacher/students' }
      ]
    },
    {
      title: 'Communication',
      items: [
        { label: 'Chat Center', icon: '💬', path: '/teacher/chat' },
        { label: 'Messages', icon: '📧', path: '/teacher/messages' },
        { label: 'Notifications', icon: '🔔', path: '/teacher/notifications' }
      ]
    }
  ];

  return (
    <DashboardLayout
      pageTitle="Teacher Chat"
      pageDescription="Communicate with students and parents"
      userRole="Teacher"
      userName="Teacher User"
      navigationSections={navigationSections}
    >
      <div className="teacherchat-alerts-container">
        {teacherchatAlerts.map(alert => (
          <div key={alert.id} className={`teacherchat-alert teacherchat-alert-${alert.type}`}>
            {alert.message}
          </div>
        ))}
      </div>

      <div className="teacherchat-container">
        <div className="teacherchat-header">
          <h1 className="teacherchat-page-title">Chat Center</h1>
          <p className="teacherchat-page-subtitle">Communicate with students and parents</p>
        </div>

        <div className="teacherchat-main">
          <div className="teacherchat-sidebar">
            <div className="teacherchat-sidebar-header">
              <h3>Active Chats</h3>
            </div>
            <div className="teacherchat-chats-list">
              {teacherchatChats.map(chat => (
                <div 
                  key={chat._id}
                  className={`teacherchat-chat-item ${teacherchatSelectedChat?._id === chat._id ? 'teacherchat-active' : ''}`}
                  onClick={() => setTeacherchatSelectedChat(chat)}
                >
                  <div className="teacherchat-chat-avatar">
                    {chat.student_name?.charAt(0) || 'S'}
                  </div>
                  <div className="teacherchat-chat-info">
                    <h4 className="teacherchat-chat-name">{chat.student_name || 'Student'}</h4>
                    <p className="teacherchat-chat-preview">{chat.last_message || 'No messages yet'}</p>
                  </div>
                  {chat.unread_count > 0 && (
                    <div className="teacherchat-unread-badge">{chat.unread_count}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="teacherchat-messages-area">
            {teacherchatSelectedChat ? (
              <>
                <div className="teacherchat-messages-header">
                  <div className="teacherchat-messages-user-info">
                    <div className="teacherchat-messages-avatar">
                      {teacherchatSelectedChat.student_name?.charAt(0) || 'S'}
                    </div>
                    <div className="teacherchat-messages-details">
                      <h3>{teacherchatSelectedChat.student_name || 'Student'}</h3>
                      <span>Student</span>
                    </div>
                  </div>
                </div>

                <div className="teacherchat-messages-list">
                  {teacherchatMessages.map((message, index) => (
                    <div 
                      key={index}
                      className={`teacherchat-message ${message.sender_role === 'Teacher' ? 'teacherchat-sent' : 'teacherchat-received'}`}
                    >
                      <div className="teacherchat-message-content">
                        {message.message}
                      </div>
                      <div className="teacherchat-message-time">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="teacherchat-message-input">
                  <input
                    type="text"
                    value={teacherchatNewMessage}
                    onChange={(e) => setTeacherchatNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="teacherchat-input-field"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        teacherchatSendMessage();
                      }
                    }}
                  />
                  <button 
                    className="teacherchat-send-btn"
                    onClick={teacherchatSendMessage}
                  >
                    Send
                  </button>
                </div>
              </>
            ) : (
              <div className="teacherchat-no-selection">
                <div className="teacherchat-no-selection-icon">💬</div>
                <h3>Select a Chat</h3>
                <p>Choose a student to start chatting</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeacherChat;
