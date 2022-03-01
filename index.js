require("dotenv").config();
require("./mongoose.js");

const express = require("express");
const exphbs = require("express-handlebars");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const UsersModel = require("./models/UsersModel.js");
const utils = require("./utils.js");
const userRoutes = require("./routes/UserRoutes.js");
const postRoutes = require("./routes/PostRoutes.js");
const commentRoutes = require("./routes/CommentRoutes.js");
const seedDataRoutes = require("./routes/SeedDataRoutes.js");
const PostsModel = require("./models/PostsModel.js");

const app = express();

app.engine(
  "hbs",
  exphbs.engine({
    extname: ".hbs",
    defaultLayout: "main",
    helpers: {
      formatDate: (time) => {
        const date = new Date(time);
        return date.toLocaleDateString() + " " + date.toLocaleTimeString();
      },
    },
  })
);

app.set("view engine", "hbs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//////////////////
// MIDDLEWARES //
////////////////
app.use((req, res, next) => {
  const { token } = req.cookies;
  if (token && jwt.verify(token, process.env.JWTSECRET)) {
    // Logged in
    const tokenData = jwt.decode(token, process.env.JWTSECRET);
    res.locals.loggedIn = true;
    res.locals.userId = tokenData.userId;
    res.locals.username = tokenData.username;
    res.locals.bio = tokenData.bio;
    res.locals.city = tokenData.city;
    res.locals.following_count = tokenData.following_count;
    res.locals.followers_count = tokenData.followers_count;
    res.locals.posts_count = tokenData.posts_count;
  } else {
    // Not Logged in
    res.locals.loggedin = false;
  }
  next();
});

const { forceAuthorize, followthem, sortPosts } = require("./middleware");

//////////////////////
// MIDDLEWARES ENDS//
////////////////////

app.get("/", sortPosts, followthem, async (req, res) => {
  let posts = req.sortPosts;
  let followthem = req.followthem;
  
  res.render("home", { posts, followthem});
});

// ROUTES

app.use("/user", userRoutes);
app.use("/post", postRoutes);
app.use("/comment", commentRoutes);
app.use("/seed-data", seedDataRoutes);

// END OF ROUTES

// Login //
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  UsersModel.findOne({ username }, (err, user) => {
    if (user && utils.comparePassword(password, user.hashedPassword)) {
      // Login successful
      const bio = user.bio;
      const city = user.city;
      const following_count = user.follows.length;
      const followers_count = user.followers.length;
      const posts_count = user.posts.length;
      const userData = {
        userId: user._id,
        username,
        bio,
        city,
        following_count,
        followers_count,
        posts_count,
      };
      const accesToken = jwt.sign(userData, process.env.JWTSECRET);
      console.log(userData);
      res.cookie("token", accesToken);
      res.redirect("/");
    } else {
      console.log(err);
      res.send("Login failed");
    }
  });
});

//Sign up
app.post("/sign-up", async (req, res) => {
  res.render("signup");
  const { username, password, confirmPassword } = req.body;

  UsersModel.findOne({ username }, async (err, user) => {
    if (user) {
      res.send("Username is already taken");
    } else if (password !== confirmPassword) {
      res.send("Incorrect password, try again");
    } else if (email == user.email) {
      res.send("Email already in use");
    } else {
      const newUser = new UsersModel({
        username,
        hashedPassword: utils.hashedPassword(password),
        //add more things here later
      });
      await newUser.save();

      res.sendStatus(200);

      res.redirect("/login");
    }
  });
});

//
app.get("/sign-up", (req, res) => {
  res.render("signup");
});

app.get("/sign-up-extra", (req, res) => {
  res.render("signup-step-2");
});

app.get("/secret2", forceAuthorize, (req, res) => {
  res.send("This is a secret page");
});

app.post("/log-out", (req, res) => {
  res.cookie("token", "", { maxAge: 0 });
  res.redirect("/");
});

app.listen(8000, () => {
  console.log("http://localhost:8000/");
});
