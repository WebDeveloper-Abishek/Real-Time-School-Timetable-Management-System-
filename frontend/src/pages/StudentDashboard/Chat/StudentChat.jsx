import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../Components/DashboardLayout/DashboardLayout';
import './StudentChat.css';

const StudentChat = () => {
  const [studentchatChats, setStudentchatChats] = useState([]);
  const [studentchatSelectedChat, setStudentchatSelectedChat] = useState(null);
  const [studentchatMessages, setStudentchatMessages] = useState([]);
  const [studentchatNewMessage, setStudentchatNewMessage] = useState('');
  const [studentchatAlerts, setStudentchatAlerts] = useState([]);

  const studentchatAddAlert = (message, type = 'success') => {
    const id = Date.now();
    setStudentchatAlerts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setStudentchatAlerts(prev => prev.filter(alert => alert.id !== id)), 5000);
  };

  const studentchatFetchChats = async () => {
    try {
      const response = await fetch('/api/chat/student-chats');
      const data = await response.json();
      setStudentchatChats(data.chats || []);
    } catch (error) {
      studentchatAddAlert('Error fetching chats', 'error');
    }
  };

  const studentchatSendMessage = async () => {
    if (!studentchatNewMessage.trim() || !studentchatSelectedChat) return;

    try {
      await fetch('/api/chat/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: studentchatSelectedChat._id,
          message: studentchatNewMessage,
          sender_role: 'Student'
        })
      });
      
      setStudentchatNewMessage('');
      studentchatFetchMessages(studentchatSelectedChat._id);
    } catch (error) {
      studentchatAddAlert('Error sending message', 'error');
    }
  };

  const studentchatFetchMessages = async (chatId) => {
    try {
      const response = await fetch(`/api/chat/messages/${chatId}`);
      const data = await response.json();
      setStudentchatMessages(data.messages || []);
    } catch (error) {
      studentchatAddAlert('Error fetching messages', 'error');
    }
  };

  useEffect(() => {
    studentchatFetchChats();
  }, []);

  useEffect(() => {
    if (studentchatSelectedChat) {
      studentchatFetchMessages(studentchatSelectedChat._id);
    }
  }, [studentchatSelectedChat]);

  const navigationSections = [
    {
      title: 'My Dashboard',
      items: [
        { label: 'Student Home', icon: '🏠', path: '/student/dashboard' },
        { label: 'My Timetable', icon: '📅', path: '/student/timetable' },
        { label: 'My Classes', icon: '📚', path: '/student/classes' },
        { label: 'Assignments', icon: '📝', path: '/student/assignments' }
      ]
    },
    {
      title: 'Communication',
      items: [
        { label: 'Chat Center', icon: '💬', path: '/student/chat' },
        { label: 'Messages', icon: '📧', path: '/student/messages' },
        { label: 'Notifications', icon: '🔔', path: '/student/notifications' }
      ]
    }
  ];

  return (
    <DashboardLayout
      pageTitle="Student Chat"
      pageDescription="Chat with your teachers"
      userRole="Student"
      userName="Student User"
      navigationSections={navigationSections}
    >
      <div className="studentchat-alerts-container">
        {studentchatAlerts.map(alert => (
          <div key={alert.id} className={`studentchat-alert studentchat-alert-${alert.type}`}>
            {alert.message}
          </div>
        ))}
      </div>

      <div className="studentchat-container">
        <div className="studentchat-header">
          <h1 className="studentchat-page-title">Chat Center</h1>
          <p className="studentchat-page-subtitle">Chat with your teachers</p>
        </div>

        <div className="studentchat-main">
          <div className="studentchat-sidebar">
            <div className="studentchat-sidebar-header">
              <h3>My Teachers</h3>
            </div>
            <div className="studentchat-chats-list">
              {studentchatChats.map(chat => (
                <div 
                  key={chat._id}
                  className={`studentchat-chat-item ${studentchatSelectedChat?._id === chat._id ? 'studentchat-active' : ''}`}
                  onClick={() => setStudentchatSelectedChat(chat)}
                >
                  <div className="studentchat-chat-avatar">
                    {chat.teacher_name?.charAt(0) || 'T'}
                  </div>
                  <div className="studentchat-chat-info">
                    <h4 className="studentchat-chat-name">{chat.teacher_name || 'Teacher'}</h4>
                    <p className="studentchat-chat-preview">{chat.last_message || 'No messages yet'}</p>
                  </div>
                  {chat.unread_count > 0 && (
                    <div className="studentchat-unread-badge">{chat.unread_count}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="studentchat-messages-area">
            {studentchatSelectedChat ? (
              <>
                <div className="studentchat-messages-header">
                  <div className="studentchat-messages-user-info">
                    <div className="studentchat-messages-avatar">
                      {studentchatSelectedChat.teacher_name?.charAt(0) || 'T'}
                    </div>
                    <div className="studentchat-messages-details">
                      <h3>{studentchatSelectedChat.teacher_name || 'Teacher'}</h3>
                      <span>Teacher</span>
                    </div>
                  </div>
                </div>

                <div className="studentchat-messages-list">
                  {studentchatMessages.map((message, index) => (
                    <div 
                      key={index}
                      className={`studentchat-message ${message.sender_role === 'Student' ? 'studentchat-sent' : 'studentchat-received'}`}
                    >
                      <div className="studentchat-message-content">
                        {message.message}
                      </div>
                      <div className="studentchat-message-time">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="studentchat-message-input">
                  <input
                    type="text"
                    value={studentchatNewMessage}
                    onChange={(e) => setStudentchatNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="studentchat-input-field"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        studentchatSendMessage();
                      }
                    }}
                  />
                  <button 
                    className="studentchat-send-btn"
                    onClick={studentchatSendMessage}
                  >
                    Send
                  </button>
                </div>
              </>
            ) : (
              <div className="studentchat-no-selection">
                <div className="studentchat-no-selection-icon">💬</div>
                <h3>Select a Teacher</h3>
                <p>Choose a teacher to start chatting</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentChat;
