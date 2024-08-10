import React, { useEffect, useState, useCallback } from "react";
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
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const socket = io("http://localhost:5000");

const Chat = () => {
  const [userIds, setUserIds] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const navigate = useNavigate();

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
    <Container component="main" maxWidth="md" sx={{ mt: 4 }}>
      <Box display="flex" justifyContent="space-between">
        <Typography variant="h4" gutterBottom>
          Chat Application
        </Typography>
        <Button variant="outlined" color="secondary" onClick={handleLogout}>
          Logout
        </Button>
      </Box>

      <Box
        display="flex"
        justifyContent="space-between"
        sx={{ height: "70vh" }}
      >
        <Box sx={{ width: "30%", borderRight: "1px solid #ddd" }}>
          <Typography variant="h6" align="center">
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
                  <ListItemText primary={getUserById(userId)} />
                </ListItem>
              ))
            ) : (
              <Typography variant="body1" align="center">
                No users online
              </Typography>
            )}
          </List>
        </Box>

        <Box sx={{ width: "70%", display: "flex", flexDirection: "column" }}>
          {selectedUser && (
            <>
              <Typography variant="h6" gutterBottom>
                Chat with {getUserById(selectedUser)}
              </Typography>
              <Box
                sx={{
                  flexGrow: 1,
                  overflowY: "auto",
                  border: "1px solid #ddd",
                  p: 2,
                }}
              >
                {messages.map((msg, index) => (
                  <Box key={index} sx={{ mb: 1 }}>
                    <Typography
                      variant="body2"
                      component="div"
                      color={
                        msg.sender === decoded.id ? "primary" : "textSecondary"
                      }
                    >
                      <strong>
                        {msg.sender === decoded.id
                          ? "You"
                          : getUserById(msg.sender)}
                      </strong>
                      : {msg.content}
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Divider sx={{ mt: 2, mb: 2 }} />
              <Box sx={{ display: "flex" }}>
                <TextField
                  variant="outlined"
                  fullWidth
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message"
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={sendMessage}
                  sx={{ ml: 2 }}
                >
                  Send
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default Chat;
