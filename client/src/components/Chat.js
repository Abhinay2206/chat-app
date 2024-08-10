import React, { useEffect, useState, useCallback, useRef } from "react";
import io from "socket.io-client";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import {
  Container,
  Typography,
  List,
  ListItem,
  ListItemText,
  Box,
  TextField,
  Button,
  Divider,
  IconButton,
  Avatar,
  Paper,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import SendIcon from "@mui/icons-material/Send";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

const socket = io("http://localhost:5000");

const Chat = () => {
  const [userIds, setUserIds] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const navigate = useNavigate();
  const messagesEndRef = useRef(null); // Ref to scroll to the bottom

  const token = localStorage.getItem("token");
  const decoded = jwtDecode(token);

  useEffect(() => {
    socket.emit("join", { userId: decoded.id });

    socket.on("updateUserList", (userList) => {
      if (Array.isArray(userList)) {
        setUserIds(userList);
        fetchUserDetails(userList);
      } else {
        console.error("User list is not an array:", userList);
      }
    });

    socket.on("receiveMessage", (message) => {
      if (
        message.sender === selectedUser ||
        message.receiver === selectedUser
      ) {
        setMessages((prevMessages) => [...prevMessages, message]);
      }
    });

    return () => {
      socket.off("updateUserList");
      socket.off("receiveMessage");
    };
  }, [decoded.id, selectedUser]);

  useEffect(() => {
    // Scroll to the bottom whenever messages update
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchUserDetails = async (userIds) => {
    try {
      const res = await axios.post("http://localhost:5000/api/users/details", {
        userIds,
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Error fetching user details:", err);
    }
  };

  const fetchMessages = async (receiverId) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/messages/${decoded.id}/${receiverId}`,
      );
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const selectUser = (userId) => {
    setSelectedUser(userId);
    fetchMessages(userId);
  };

  const sendMessage = useCallback(async () => {
    if (selectedUser && message.trim()) {
      const msgData = {
        sender: decoded.id,
        receiver: selectedUser,
        content: message,
      };
      socket.emit("sendMessage", msgData);
      setMessages((prevMessages) => [...prevMessages, msgData]);
      setMessage("");
    } else {
      console.error(
        "Cannot send message. Either no user selected or message is empty.",
      );
    }
  }, [selectedUser, message, decoded.id]);

  const getUserById = (id) => {
    const user = users.find((user) => user._id === id);
    if (user) {
      return id === decoded.id ? `${user.username} (you)` : user.username;
    }
    return "Unknown User";
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <Container component="main" maxWidth="lg" sx={{ mt: 4 }}>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h4">Chat</Typography>
        <Button variant="outlined" color="primary" onClick={handleLogout}>
          Logout
        </Button>
      </Box>

      <Box
        display="flex"
        sx={{ height: "80vh", borderRadius: 2, overflow: "hidden" }}
      >
        <Box
          sx={{
            width: "30%",
            borderRight: "1px solid #ddd",
            overflowY: "auto",
            backgroundColor: "#f9f9f9",
          }}
        >
          <Typography variant="h6" align="center" sx={{ p: 2 }}>
            Users
          </Typography>
          <List>
            {userIds.length > 0 ? (
              userIds.map((userId) => (
                <ListItem
                  button
                  key={userId}
                  selected={selectedUser === userId}
                  onClick={() => selectUser(userId)}
                >
                  <Avatar sx={{ mr: 2 }}>
                    <AccountCircleIcon />
                  </Avatar>
                  <ListItemText primary={getUserById(userId)} />
                </ListItem>
              ))
            ) : (
              <Typography variant="body1" align="center" sx={{ p: 2 }}>
                No users online
              </Typography>
            )}
          </List>
        </Box>

        <Box
          sx={{
            width: "70%",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#fff",
          }}
        >
          {selectedUser ? (
            <>
              <Typography
                variant="h6"
                sx={{
                  p: 2,
                  borderBottom: "1px solid #ddd",
                  backgroundColor: "#f1f1f1",
                }}
              >
                Chat with {getUserById(selectedUser)}
              </Typography>
              <Box
                sx={{
                  flexGrow: 1,
                  overflowY: "auto",
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {messages.map((msg, index) => (
                  <Box
                    key={index}
                    sx={{
                      mb: 1,
                      display: "flex",
                      justifyContent:
                        msg.sender === decoded.id ? "flex-end" : "flex-start",
                    }}
                  >
                    <Paper
                      elevation={3}
                      sx={{
                        p: 1,
                        maxWidth: "70%",
                        bgcolor: msg.sender === decoded.id ? "#e3f2fd" : "#fff",
                        borderRadius: 2,
                      }}
                    >
                      <Typography
                        variant="body2"
                        component="div"
                        color={
                          msg.sender === decoded.id
                            ? "primary"
                            : "textSecondary"
                        }
                      >
                        <strong>
                          {msg.sender === decoded.id
                            ? "You"
                            : getUserById(msg.sender)}
                        </strong>
                        : {msg.content}
                      </Typography>
                    </Paper>
                  </Box>
                ))}
                <div ref={messagesEndRef} />{" "}
                {/* This will act as the scroll target */}
              </Box>
              <Divider />
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  p: 1,
                  borderTop: "1px solid #ddd",
                  backgroundColor: "#f1f1f1",
                }}
              >
                <TextField
                  variant="outlined"
                  fullWidth
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message"
                  sx={{ borderRadius: 20 }}
                />
                <IconButton
                  color="primary"
                  onClick={sendMessage}
                  sx={{ ml: 1 }}
                >
                  <SendIcon />
                </IconButton>
              </Box>
            </>
          ) : (
            <Typography
              variant="h6"
              sx={{ p: 2, textAlign: "center", flexGrow: 1 }}
            >
              Select a user to start chatting
            </Typography>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default Chat;
