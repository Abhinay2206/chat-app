const User = require("../models/User");

const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || !(await user.matchPassword(password))) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }
    const token = user.getSignedJwtToken();
    res.status(200).json({
      success: true,
      token,
      userId: user._id,
      username: user.username,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

const register = async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res
      .status(400)
      .json({ success: false, error: "Passwords do not match" });
  }

  try {
    // Check if user already exists
    let user = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (user) {
      return res
        .status(400)
        .json({ success: false, error: "User already exists" });
    }

    user = await User.create({ username, email, password });
    const token = user.getSignedJwtToken();
    res.status(200).json({
      success: true,
      token,
      userId: user._id,
      username: user.username,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

const logout = (req, res) => {
  res.status(200).json({ success: true });
};

module.exports = { login, register, logout };
