// routes/pokemon.js
const express = require("express");
const axios = require("axios");
const router = express.Router();

const POKE_API_BASE = "https://pokeapi.co/api/v2";

/* #################################
 *  세대별 포켓몬 리스트 헬퍼 함수
 * ################################# */
// PokeAPI /generation/:gen 에서 species 목록을 가져와
// { id, name_en, image } 형식으로 가공
async function getGenerationFromPokeApi(genNumber) {
  const url = `${POKE_API_BASE}/generation/${genNumber}`;
  const { data } = await axios.get(url);

  const list = data.pokemon_species
    .map((species) => {
      // species.url 예: "https://pokeapi.co/api/v2/pokemon-species/152/"
      const segments = species.url.split("/").filter(Boolean);
      const id = Number(segments[segments.length - 1]);

      return {
        id,
        name_en: species.name,
        // 공식 아트워크 이미지
        image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
      };
    })
    // 도감 번호 순 정렬
    .sort((a, b) => a.id - b.id);

  return list;
}

/* #################################
 *  👉 포켓몬 리스트 (간단 정보)
 *      /api/pokemon?page=&limit=
 * ################################# */
router.get("/", async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const { data } = await axios.get(
      `${POKE_API_BASE}/pokemon?offset=${offset}&limit=${limit}`
    );

    // results: [{ name, url }, ...]
    const results = data.results.map((poke) => {
      const segments = poke.url.split("/").filter(Boolean);
      const id = segments[segments.length - 1];

      return {
        id: Number(id),
        name_en: poke.name,
        // 스프라이트는 PokeAPI 공식 깃허브에서 바로 사용
        sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
      };
    });

    res.json({
      count: data.count,
      page: Number(page),
      limit: Number(limit),
      pokemons: results,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "포켓몬 리스트 가져오기 실패" });
  }
});

/* #################################
 *  👉 세대별 포켓몬 리스트 (⭐ 새로 추가)
 *      /api/pokemon/generation/1  -> 1세대
 *      /api/pokemon/generation/2  -> 2세대
 *      /api/pokemon/generation/2  -> 3세대
 *
 * ################################# */
router.get("/generation/:gen", async (req, res) => {
  try {
    const gen = Number(req.params.gen);

    // 간단 검증 (1~9세대 정도 허용)
    if (isNaN(gen) || gen < 1 || gen > 9) {
      return res
        .status(400)
        .json({ message: "유효하지 않은 세대 번호입니다." });
    }

    const pokemons = await getGenerationFromPokeApi(gen);
    return res.json({
      generation: gen,
      count: pokemons.length,
      pokemons,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "세대별 포켓몬 리스트 가져오기 실패" });
  }
});

/* #################################
 *  👉 포켓몬 상세 정보
 *      /api/pokemon/:id
 * ################################# */
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [pokemonRes, speciesRes] = await Promise.all([
      axios.get(`${POKE_API_BASE}/pokemon/${id}`),
      axios.get(`${POKE_API_BASE}/pokemon-species/${id}`),
    ]);

    const pokemon = pokemonRes.data;
    const species = speciesRes.data;

    // 한글 이름 찾기
    const koreanNameObj = species.names.find((n) => n.language.name === "ko");
    const name_ko = koreanNameObj ? koreanNameObj.name : pokemon.name;

    // 기본 스탯 정리
    const stats = pokemon.stats.map((s) => ({
      name: s.stat.name, // hp, attack, defense ...
      base: s.base_stat,
    }));

    // 타입
    const types = pokemon.types.map((t) => t.type.name); // ['fire', 'flying']

    // 특성
    const abilities = pokemon.abilities.map((a) => ({
      name: a.ability.name,
      isHidden: a.is_hidden,
    }));

    // 스프라이트/아트워크
    const sprites = {
      front_default: pokemon.sprites.front_default,
      front_shiny: pokemon.sprites.front_shiny,
      official_artwork: pokemon.sprites.other["official-artwork"].front_default,
    };

    const cries = pokemon.cries; // { latest, legacy }

    res.json({
      id: pokemon.id,
      name_en: pokemon.name,
      name_ko,
      height: pokemon.height,
      weight: pokemon.weight,
      types,
      stats,
      abilities,
      sprites,
      cries,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "포켓몬 상세정보 가져오기 실패" });
  }
});

module.exports = router;
