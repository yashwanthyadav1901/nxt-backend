const User = require("./../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ message: "All fields required" });
  }

  const duplicate = await User.findOne({ username });

  if (duplicate) {
    res.status(409).json({ message: "username already exists" });
  }

  try {
    hashedpwd = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      password: hashedpwd,
    });

    res.status(200).json({ message: `user ${username} created successfully` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(409).json({ message: "All fields required" });
  }

  const foundUser = await User.findOne({ username });

  if (!foundUser) {
    res.status(404).json({ message: "user not found" });
  }

  const match = await bcrypt.compare(password, foundUser.password);

  if (!match) {
    res.status(500).json({ message: "wrond password" });
  }

  const accessToken = jwt.sign(
    {
      id: foundUser._id,
      username: foundUser.username,
      password: foundUser.password,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    {
      id: foundUser._id,
      username: foundUser.username,
      password: foundUser.password,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  res.cookie(refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.json({ accessToken });
};

module.exports = {
  register,
  login,
};
