const User = require("../models/User.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Blog = require("../models/Blog.js");

const getCurrentUser = async (req) => {
  try {
    const token =
      req.cookies?.access_token ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return null;
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      return null;
    }

    return user.username;
  } catch (error) {
    console.log(error.message);
  }
};
const getCurrentUserID = async (req) => {
  try {
    const token =
      req.cookies?.access_token ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return null;
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      return null;
    }

    return user._id;
  } catch (error) {
    console.log(error.message);
  }
};

exports.myBlogs = async (req, res) => {
  // userID
  const user = await getCurrentUserID(req);
  // Username
  const userName = await User.findById(user._id);

  const myBlogs = await Blog.find({ createdBy: user });
  console.log(myBlogs);

  res.render("my-blogs", {
    userId: user,
    user: userName.username,
    blogs: myBlogs,
  });
};

exports.createBlog = async (req, res) => {
  // userID
  const user = await getCurrentUserID(req);
  const userName = await User.findById(user._id);

  res.render("add-blog", {
    userId: user,
    user: userName.username,
  });
};

exports.addBlog = async (req, res) => {
  try {
    const user = await getCurrentUser(req);

    const userID = await getCurrentUserID(req);
    const { title, body } = req.body;
    const blog = await Blog.create({
      title,
      body,
      createdBy: userID,
      image: req?.file?.filename,
    });

    if (!blog) {
      return res.status(400).json({
        message: "Failed To Create a Blog",
      });
    }
    return res.redirect("/");
  } catch (error) {
    console.log(error.message);
  }
};

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;

    await user.save({ validationBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.log(error.message);
  }
};

exports.homePageController = async (req, res) => {
  const user = await getCurrentUser(req);
  const allBlogs = await Blog.find({}).limit(4);
  res.render("index", {
    user: user,
    blogs: allBlogs,
  });
};

exports.singleBlog = async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    const { id } = req.params;
    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).send({
        success: false,
        message: "blog not found with this id",
      });
    }
    const { username } = await User.findById(blog.createdBy);

    res.render("singleBlog", {
      user: user,
      blog,
      username: username,
    });
  } catch (error) {
    console.log(error.message);
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    // userID
    const user = await getCurrentUserID(req);
    // Username
    const userName = await User.findById(user._id);
    const { id } = req.params;
    const myBlogs = await Blog.find({ createdBy: user });

    const blog = await Blog.findByIdAndDelete(id);

    if (!blog) {
      return res.status(404).send({
        success: false,
        message: "blog not found with this id",
      });
    }

    // return res.render("my-blogs", {
    //   userId: user,
    //   user: userName.username,
    //   blogs: myBlogs,
    // });

    return res.redirect("/");
  } catch (error) {
    console.log(error.message);
  }
};

exports.updateBlog = async (req, res) => {
  try {
    // userID
    const user = await getCurrentUser(req);
    // Username
    const userName = await User.findById(user._id);
    const { id } = req.params;
    const blog = await Blog.findById(id);

    return res.render("update-form", {
      user: user,
      blog,
    });
  } catch (error) {
    console.log(error.message);
  }
};

exports.updateBlogPost = async (req, res) => {
  try {
    const { title, body, id } = req.body;

    const blog = await Blog.findByIdAndUpdate(
      id,
      { ...req.body },
      { new: true }
    );

    if (blog) {
      return res.redirect("/");
    }

    return res.status(404).json({
      success: false,
      message: "Failed to update blog post",
    });
  } catch (error) {
    console.log(error.message);
  }
};

exports.registerPageController = (req, res) => {
  res.render("register");
};

exports.validateUser = async (req, res) => {
  try {
    const { unm, email, pwd } = req.body;
    if (!unm || !email || !pwd) {
      return res.status(400).json({
        message: "Please enter all required fields",
      });
    }

    const existedUser = await User.findOne({ email: email });

    if (existedUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(pwd, 10);

    const user = await User.create({
      username: unm,
      email,
      password: hashedPassword,
    });

    const createdUser = await User.findById(user._id);

    if (!createdUser) {
      return res.status(400).json({
        message: "Failed To Register a User",
      });
    }

    return res.status(201).json({
      message: "Register Successfully",
      createdUser,
    });
  } catch (error) {
    console.log(error.message);
  }
};

exports.loginUser = async (req, res) => {
  try {
    const allBlogs = await Blog.find({}).limit(4);

    const { email, pwd } = req.body;

    if (!email || !pwd) {
      return res.status(400).json({
        message: "Please enter all required fields",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(pwd, user.password);

    if (!isPasswordCorrect) {
      return res.status(400).json({
        message: "Invalid Credentials",
      });
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    );

    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    const options = {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("access_token", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .render("index", {
        user: loggedInUser.username,
        blogs: allBlogs,
      });
  } catch (error) {
    console.log(error.message);
  }
};

exports.logout = async (req, res) => {
  const allBlogs = await Blog.find({}).limit(4);

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("access_token", options)
    .clearCookie("refreshToken", options)
    .render("index", {
      user: null,
      blogs: allBlogs,
    });
};
