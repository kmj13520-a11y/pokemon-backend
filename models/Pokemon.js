// models/pokemon.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PokemonSchema = new Schema(
  {
    // 도감 번호 (1~151 등)
    pokemonId: {
      type: Number,
      required: true,
      unique: true,
    },

    // 이름 (한글/영어)
    name_ko: {
      type: String,
      required: true,
      trim: true,
    },
    name_en: {
      type: String,
      required: true,
      trim: true,
    },

    // 기본 이미지 (공식 아트워크)
    image: {
      type: String,
      required: true,
    },

    // 타입 (예: ["grass", "poison"])
    types: [
      {
        type: String,
        required: true,
      },
    ],

    // 키/몸무게 (PokeAPI 단위 그대로: dm, hg)
    height: {
      type: Number,
    },
    weight: {
      type: Number,
    },

    // 경험치, 능력, 능력치 등은 선택 필드로 추가
    base_experience: {
      type: Number,
    },

    // ["limber", "imposter"] 이런 식으로 저장
    abilities: [
      {
        type: String,
      },
    ],

    // 능력치: hp, attack, ...
    stats: {
      hp: Number,
      attack: Number,
      defense: Number,
      special_attack: Number,
      special_defense: Number,
      speed: Number,
    },

    // 즐겨찾기/좋아요 같은 용도
    favoriteCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Pokemon", PokemonSchema);
