// seedPokemon.js
require("dotenv").config();
const mongoose = require("mongoose");
const axios = require("axios");
const Pokemon = require("./models/pokemon");

const MONGO_URI = process.env.DATABASE;

// PokeAPI에서 한 포켓몬 정보 + species(한글 이름)까지 가져오기
async function fetchPokemon(id) {
  const pokemonUrl = `https://pokeapi.co/api/v2/pokemon/${id}`;
  const speciesUrl = `https://pokeapi.co/api/v2/pokemon-species/${id}`;

  const [pokemonRes, speciesRes] = await Promise.all([
    axios.get(pokemonUrl),
    axios.get(speciesUrl),
  ]);

  const pokemon = pokemonRes.data;
  const species = speciesRes.data;

  // 한글 이름 찾기
  const koNameObj = species.names.find((n) => n.language.name === "ko");
  const name_ko = koNameObj ? koNameObj.name : pokemon.name;

  // 타입
  const types = pokemon.types.map((t) => t.type.name);

  // abilities 이름만 추출
  const abilities = pokemon.abilities.map((a) => a.ability.name);

  // stats를 보기 좋게 맵핑
  const statsObj = {};
  pokemon.stats.forEach((s) => {
    const key = s.stat.name; // "hp", "attack", "special-attack", ...
    const base = s.base_stat;

    switch (key) {
      case "hp":
        statsObj.hp = base;
        break;
      case "attack":
        statsObj.attack = base;
        break;
      case "defense":
        statsObj.defense = base;
        break;
      case "special-attack":
        statsObj.special_attack = base;
        break;
      case "special-defense":
        statsObj.special_defense = base;
        break;
      case "speed":
        statsObj.speed = base;
        break;
      default:
        break;
    }
  });

  const image =
    pokemon.sprites.other?.["official-artwork"]?.front_default ||
    pokemon.sprites.front_default;

  return {
    pokemonId: pokemon.id,
    name_en: pokemon.name,
    name_ko,
    image,
    types,
    height: pokemon.height,
    weight: pokemon.weight,
    base_experience: pokemon.base_experience,
    abilities,
    stats: statsObj,
  };
}

async function seed() {
  try {
    console.log("📡 MongoDB 연결중...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB 연결 완료");

    // 기존 데이터 삭제 (처음 세팅/리셋 용도)
    await Pokemon.deleteMany({});
    console.log("🧹 기존 Pokemon 컬렉션 비움");

    const docs = [];

    // 🔢 1 ~ 151 (1세대만)
    for (let id = 1; id <= 151; id++) {
      console.log(`⬇️  PokeAPI에서 포켓몬 ${id} 불러오는 중...`);
      const doc = await fetchPokemon(id);
      docs.push(doc);
    }

    console.log("💾 DB에 저장 중...");
    await Pokemon.insertMany(docs);

    console.log("🌱 1~151 포켓몬 시드 완료!");
    process.exit(0);
  } catch (err) {
    console.error("❌ 시드 중 오류 발생:", err.message);
    process.exit(1);
  }
}

seed();
