const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.post("/users/details", async (req, res) => {
  const { userIds } = req.body;
  try {
    const users = await User.find({ _id: { $in: userIds } }).select(
      "id username",
    );
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
