const express = require("express");
const router = express.Router();

const Team = require("../models/Team"); // 아까 Order 스키마를 Team으로 바꿔둔 그 모델
const auth = require("../middleware/auth");

/**
 * 1) 새 팀 생성
 * POST /api/teams
 * body: { name: string, pokemons: [{ pokemonId, name_ko, image }], isPublic?: boolean }
 */
router.post("/", auth, async (req, res) => {
  try {
    const { name, pokemons, isPublic } = req.body;

    if (!name || !pokemons || !pokemons.length) {
      return res
        .status(400)
        .json({ message: "팀 이름과 포켓몬 목록을 입력해주세요." });
    }

    if (pokemons.length > 6) {
      return res
        .status(400)
        .json({ message: "팀에는 최대 6마리의 포켓몬만 담을 수 있습니다." });
    }

    const team = await Team.create({
      user: req.user._id, // JWT 미들웨어에서 넣어준 사용자 ID
      name,
      pokemons, // [{ pokemonId, name_ko, image }, ...]
      isPublic: !!isPublic,
    });

    return res.status(201).json({
      message: "팀이 저장되었습니다.",
      team,
    });
  } catch (err) {
    console.error("TEAM CREATE ERROR:", err);
    return res.status(500).json({ message: "서버 에러" });
  }
});

/**
 * 2) 내 팀 목록 조회
 * GET /api/teams
 */
router.get("/", auth, async (req, res) => {
  try {
    const teams = await Team.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    return res.json({ teams });
  } catch (err) {
    console.error("TEAM LIST ERROR:", err);
    return res.status(500).json({ message: "서버 에러" });
  }
});

/**
 * 3) 팀 공개 여부 토글 / 변경
 * PATCH /api/teams/:id/public
 * body: { isPublic: boolean }
 */
router.patch("/:id/public", auth, async (req, res) => {
  try {
    const { isPublic } = req.body;

    const team = await Team.findOne({
      _id: req.params.id,
      user: req.user._id, // 내 팀만 수정 가능
    });

    if (!team) {
      return res.status(404).json({ message: "팀을 찾을 수 없습니다." });
    }

    // true/false가 넘어오면 그 값 사용, 아니면 토글
    if (typeof isPublic === "boolean") {
      team.isPublic = isPublic;
    } else {
      team.isPublic = !team.isPublic;
    }

    await team.save();

    return res.json({
      message: `팀이 ${team.isPublic ? "공개" : "비공개"}로 설정되었습니다.`,
      team,
    });
  } catch (err) {
    console.error("TEAM PUBLIC ERROR:", err);
    return res.status(500).json({ message: "서버 에러" });
  }
});

module.exports = router;
