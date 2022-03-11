const express = require("express");
const router = express.Router();

const UsersModel = require("../models/UsersModel.js");
const PostsModel = require("../models/PostsModel.js");

const { timeAgo, getUniqueFilename } = require("./../utils");
const { forceAuthorize, followthem } = require("./../middleware.js");

router.get("/", (req, res) => {
  const userId = res.locals.userId;

  res.redirect("/user/" + userId);
});

//USER PROFILE
router.get("/:id", followthem, async (req, res) => {
  let edit = false;
  const id = req.params.id;
  let followthem = req.followthem;
  const profile = await UsersModel.findOne({ _id: id }).lean();
  const posts = await PostsModel.find({ author_id: id }).lean();

  for (let post of posts) {
    post.created = timeAgo(post.created);
  }
  if (id === res.locals.userId) {
    edit = true;
  }
  res.render("user-profile", { followthem, posts, profile, edit });
});

router.post("/follow", async (req, res) => {
  const userId = res.locals.userId;
  const id = req.query.id;
  const mainUser = await UsersModel.findOne({ userId });

  res.redirect("/");
});

router.get("/edit/:id", followthem, async (req, res) => {
  const id = req.params.id;
  let followthem = req.followthem;
  if (res.locals.userId === id) {
    const user = await UsersModel.findOne({ _id: id }).lean();
    res.render("profile-edit", { user, followthem });
  }
});

router.post("/edit/:id", followthem, async (req, res) => {
  let edit = false;
  const id = req.params.id;
  if (id === res.locals.userId) {
    edit = true;
  }
  let followthem = req.followthem;
  let coverimage = "";
  let coverimagefilename = "";
  let coverimageuploadPath = "";
  let image = "";
  let filename = "";
  let uploadPath = "";
  if (req.files && req.files.image) {
    image = req.files.image;
    filename = getUniqueFilename(image.name);
    uploadPath =
      "/Users/charleskrook/Documents/twitter-clone" +
      "/public/uploads/" +
      filename;
    await image.mv(uploadPath);
    const dbUser = await UsersModel.findOne({ _id: id });
    dbUser.profilePicture = "/uploads/" + filename;
    const profile = await UsersModel.findOne({ _id: id }).lean();
    await dbUser.save();
  }
  if (req.files && req.files.coverimage) {
    coverimage = req.files.coverimage;
    coverimagefilename = getUniqueFilename(coverimage.name);
    coverimageuploadPath =
      "/Users/charleskrook/Documents/twitter-clone" +
      "/public/uploads/" +
      coverimagefilename;
    await coverimage.mv(coverimageuploadPath);
    const dbUser = await UsersModel.findOne({ _id: id });
    dbUser.coverimage = "/uploads/" + coverimagefilename;
    await dbUser.save();
  }

  const { displayname, username, email, bio, city, website } = req.body;
  if (res.locals.userId === id) {
    const dbUser = await UsersModel.findOne({ _id: id });
    dbUser.displayname = displayname;
    dbUser.username = username;
    dbUser.email = email;
    dbUser.bio = bio;
    dbUser.city = city;
    dbUser.website = website;
    await dbUser.save();
    const profile = await UsersModel.findOne({ _id: id }).lean();
    res.render("user-profile", { profile, followthem, edit });
  }
});

router.post("/delete/:id", async (req, res) => {
  await UsersModel.findByIdAndDelete(req.params.id);

  res.cookie("token", "", { maxAge: 0 });

  res.redirect("/");
});

module.exports = router;
