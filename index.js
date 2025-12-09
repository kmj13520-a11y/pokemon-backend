const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();
require("./db/connectDB");

const app = express();
const PORT = process.env.PORT || 5000;

// 👉 import routes
const userRoutes = require("./routes/users");
const pokemonRoutes = require("./routes/pokemon"); // ✅ 포켓몬 라우트 추가
// const teamRoutes = require("./routes/team");    // 나중에 팀 기능 만들 때

// 👉 middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 👉 정적 파일
app.use("/profile", express.static(__dirname + "/upload/profiles"));
// ⚠️ 지금은 PokeAPI 공식 이미지/깃허브를 쓰니까 이건 아직 안 써도 됨
// app.use("/pokemon", express.static(__dirname + "/upload/pokemon"));

// 👉 API routes
app.use("/api/user", userRoutes); // 회원 기능
app.use("/api/pokemon", pokemonRoutes); // ✅ 포켓몬 도감 API (1·2세대 포함)
// app.use("/api/team", teamRoutes);       // 나중에 팀 기능 추가 시 활성화

app.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
});
