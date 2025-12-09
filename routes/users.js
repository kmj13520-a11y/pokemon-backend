const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const _ = require("lodash");

const User = require("../models/users");
const auth = require("../middleware/auth");

// ✅ 1) 로그인된 유저 프로필 조회
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    return res.json(user); // send 대신 json으로 통일
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ 2) 프로필 이미지 업로드 설정 (그대로 사용 가능)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "upload/profiles");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = file.fieldname + "-" + Date.now() + ext;
    cb(null, filename);
    req.filename = filename; // save filename in request object
  },
});
const upload = multer({ storage });

// ✅ 3) 회원가입
router.post("/signup", upload.single("profilePic"), async (req, res) => {
  const { name, email, password, bio } = req.body; // ❌ deliveryAddress 제거, ✔ bio 추가(선택)

  try {
    // 이메일 중복 체크
    let user = await User.findOne({ email });
    if (user) {
      // 업로드된 파일 삭제 (실패했으니까)
      if (req.file) {
        const filePath = path.join("upload", "profiles", req.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      return res.status(400).json({ message: "이미 가입된 이메일 입니다." });
    }

    // 새 유저 생성
    user = new User({
      name,
      email,
      password,
      bio: bio || "",
      profilePic: req.file ? req.filename : "default.jpg",
    });

    // 비밀번호 해시
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // 저장
    await user.save();

    // 토큰에 넣어줄 최소 정보
    const payload = _.pick(user, [
      "_id",
      "name",
      "email",
      "profilePic",
      "isAdmin",
    ]);

    jwt.sign(
      payload,
      process.env.JWTSECRET, // 🔁 기존 JWTSECRET 그대로 사용
      { expiresIn: "7d" }, // 📌 1시간(3600) → 7일 정도로 살짝 늘려봄 (원하면 다시 3600으로)
      (err, token) => {
        if (err) throw err;
        return res.status(201).json({ token, user: payload });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ 4) 로그인
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // 이메일로 유저 찾기
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ message: "이메일 또는 패스워드가 틀립니다." });
    }

    // 비밀번호 비교
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "이메일 또는 패스워드가 틀립니다." });
    }

    const payload = _.pick(user, [
      "_id",
      "name",
      "email",
      "profilePic",
      "isAdmin",
    ]);

    jwt.sign(
      payload,
      process.env.JWTSECRET,
      { expiresIn: "7d" }, // 회원은 자주 접속하니까 좀 더 길게
      (err, token) => {
        if (err) throw err;
        return res.json({ token, user: payload });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
