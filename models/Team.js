const mongoose = require("mongoose");

// 팀 안에 들어가는 개별 포켓몬 구조
const pokemonSchema = new mongoose.Schema(
  {
    pokemonId: {
      type: Number, // 포켓몬 번호 (1~151 등)
      required: true,
    },
    name_ko: {
      type: String, // 한국어 이름
      required: true,
    },
    image: {
      type: String, // 스프라이트 이미지 URL
      required: true,
    },
  },
  { _id: false } // 굳이 _id 안 만들어도 됨
);

const teamSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String, // 팀 이름 (예: '관동 리그 우승팀')
      required: true,
      trim: true,
    },
    pokemons: {
      type: [pokemonSchema],
      validate: {
        validator: function (v) {
          return v.length > 0 && v.length <= 6; // 1~6마리 제한
        },
        message: "팀에는 최소 1마리, 최대 6마리의 포켓몬만 담을 수 있습니다.",
      },
    },
    isPublic: {
      type: Boolean, // 나중에 '공개 팀' 기능에 사용 가능
      default: false,
    },
  },
  { timestamps: true } // createdAt, updatedAt 자동 생성
);

module.exports = mongoose.model("Team", teamSchema);
