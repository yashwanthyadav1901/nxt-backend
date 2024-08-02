require("dotenv").config();
const { error } = require("console");
const express = require("express");
const { default: mongoose } = require("mongoose");
const app = express();
const path = require("path");
const connectDB = require("./config/dbConfig");
const cookieParser = require("cookie-parser");
const PORT = process.env.PORT;

connectDB();

app.use(express.json());

app.use(cookieParser());

app.use("/", express.static(path.join(__dirname, "public")));

app.use("/", require("./routes/root"));
app.use("/auth", require("./routes/authRoutes"));

app.all("*", (req, res) => {
  res.status = 404;
  if (req.accepts("html")) {
    res.sendFile(path.join(__dirname, "views", "404.html"));
  }
});

mongoose.connection.once("open", () => {
  console.log("database connected");
  app.listen(PORT, () => {
    console.log(`server listening on ${PORT}`);
  });
});

mongoose.connection.on("error", (error) => {
  console.log(error);
});
