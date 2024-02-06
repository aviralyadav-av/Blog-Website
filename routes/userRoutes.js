const express = require("express");
const router = express.Router();
const { verifyJWT } = require("../middlewares/auth.middleware.js");

const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/");
  },
  filename: function (req, file, cb) {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage: storage });
const {
  homePageController,
  registerPageController,
  validateUser,
  loginUser,
  logout,
  myBlogs,
  createBlog,
  addBlog,
  singleBlog,
  deleteBlog,
  updateBlog,
  updateBlogPost,
} = require("../controllers/homePageController");

router.get("/", homePageController);
router.get("/register", registerPageController);
router.get("/my-blogs", myBlogs);
router.get("/add-blog", createBlog);
router.get("/blog/:id", singleBlog);
router.get("/blog-delete/:id", deleteBlog);
router.get("/blog-update/:id", updateBlog);
router.post("/addBlog", upload.single("image"), addBlog);
router.post("/final-update", updateBlogPost);
router.get("/logout", verifyJWT, logout);
router.post("/validateUser", validateUser);
router.post("/validateLogin", loginUser);

module.exports = router;
