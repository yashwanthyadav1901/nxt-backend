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

  res.cookie("jwt", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.json({ accessToken });
};

const refresh = (req, res) => {
  const cookies = req.cookies;

  if (!cookies?.jwt) return res.status(401).json({ message: "Unauthorized" });

  const refreshToken = cookies.jwt;

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    async (err, decoded) => {
      if (err) return res.status(403).json({ message: "Forbidden" });

      const foundUser = await User.findOne({
        username: decoded.username,
      }).exec();

      if (!foundUser) return res.status(401).json({ message: "Unauthorized" });

      const accessToken = jwt.sign(
        {
          UserInfo: {
            username: foundUser.username,
            roles: foundUser.roles,
          },
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
      );

      res.json({ accessToken });
    }
  );
};

const logout = (req, res) => {
  const cookies = req.cookies;

  if (!cookies?.jwt) return res.sendStatus(204);
  res.clearCookie("jwt", { httpOnly: true, secure: true, sameSite: "None" });
  res.json({ message: "cookie cleared" });
};

module.exports = {
  register,
  login,
  refresh,
  logout,
};
