const express = require("express");
const router = express.Router();

const Pokemon = require("../models/products"); // 방금 바꾼 Pokemon 스키마
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

/**
 * 1) 추천 포켓몬 3개 (예: 번호 순으로 앞 3개)
 * GET /api/pokemon/featured
 */
router.get("/featured", async (req, res) => {
  try {
    const featured = await Pokemon.find(
      {},
      {
        _id: 0,
        pokemonId: 1,
        name_ko: 1,
        name_en: 1,
        image: 1,
        types: 1,
      }
    )
      .sort({ pokemonId: 1 }) // 1,2,3… 순서
      .limit(3);

    return res.json(featured);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

/**
 * 2) 자동완성 검색
 * GET /api/pokemon/suggestions?search=피카
 */
router.get("/suggestions", async (req, res) => {
  try {
    const search = req.query.search || "";
    if (!search.trim()) {
      return res.json([]);
    }

    const regex = new RegExp(search, "i");
    const pokemons = await Pokemon.find(
      {
        $or: [{ name_ko: regex }, { name_en: regex }],
      },
      {
        _id: 0,
        pokemonId: 1,
        name_ko: 1,
        name_en: 1,
      }
    ).limit(10);

    res.json(pokemons);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

/**
 * 3) 단일 포켓몬 상세
 * GET /api/pokemon/:pokemonId
 */
router.get("/:pokemonId", async (req, res) => {
  const pokemonId = parseInt(req.params.pokemonId, 10);

  if (Number.isNaN(pokemonId)) {
    return res.status(400).json({ message: "Invalid pokemonId" });
  }

  try {
    const pokemon = await Pokemon.findOne(
      { pokemonId },
      {
        _id: 0,
        pokemonId: 1,
        name_ko: 1,
        name_en: 1,
        image: 1,
        types: 1,
        height: 1,
        weight: 1,
        favoriteCount: 1,
      }
    );

    if (!pokemon) {
      return res.status(404).json({ message: "Pokemon not found" });
    }

    res.json(pokemon);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

/**
 * 4) 포켓몬 목록 + 검색 + 타입 필터 + 페이지네이션
 * GET /api/pokemon
 *   ?page=1&perPage=20&search=피카&type=electric
 */
router.get("/", async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const perPage = parseInt(req.query.perPage, 10) || 20;
  const startIndex = (page - 1) * perPage;
  const querySearch = req.query.search || null;
  const queryType = req.query.type || null;

  try {
    const query = {};

    if (querySearch) {
      const regex = new RegExp(querySearch, "i");
      query.$or = [{ name_ko: regex }, { name_en: regex }];
    }

    if (queryType) {
      // types: ["fire","flying"] 이런 배열이라면
      query.types = queryType.toLowerCase();
    }

    const pokemons = await Pokemon.find(query, {
      _id: 0,
      pokemonId: 1,
      name_ko: 1,
      name_en: 1,
      image: 1,
      types: 1,
      favoriteCount: 1,
    })
      .sort({ pokemonId: 1 })
      .skip(startIndex)
      .limit(perPage);

    const totalPokemons = await Pokemon.countDocuments(query);
    const totalPages = Math.ceil(totalPokemons / perPage);

    return res.json({
      pokemons,
      currentPage: page,
      perPage,
      totalPokemons,
      totalPages,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

/**
 * 5) 포켓몬 수동 등록 (관리자용)
 * POST /api/pokemon
 * body: { pokemonId, name_ko, name_en, image, types, height, weight }
 */
router.post("/", auth, admin, async (req, res) => {
  try {
    const { pokemonId, name_ko, name_en, image, types, height, weight } =
      req.body;

    if (!pokemonId || !name_ko || !image) {
      return res
        .status(400)
        .json({ message: "pokemonId, name_ko, image는 필수입니다." });
    }

    const exists = await Pokemon.findOne({ pokemonId });
    if (exists) {
      return res.status(409).json({ message: "이미 존재하는 포켓몬입니다." });
    }

    const newPokemon = await Pokemon.create({
      pokemonId,
      name_ko,
      name_en,
      image,
      types,
      height,
      weight,
    });

    res.status(201).json(newPokemon);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

/**
 * 6) 포켓몬 삭제 (관리자용, 선택)
 * DELETE /api/pokemon/:pokemonId
 */
router.delete("/:pokemonId", auth, admin, async (req, res) => {
  const pokemonId = parseInt(req.params.pokemonId, 10);

  if (Number.isNaN(pokemonId)) {
    return res.status(400).json({ message: "Invalid pokemonId" });
  }

  try {
    await Pokemon.findOneAndDelete({ pokemonId });
    res.json({ message: "Pokemon Deleted Successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
