const mongoose = require("mongoose");
require("dotenv").config();

const Pokemon = require("./models/Pokemon");
const pokemonData = require("./pokemonData.json"); // 포켓몬 JSON 배열

async function seedPokemon() {
  try {
    await mongoose.connect(process.env.DATABASE, {});
    console.log("MongoDB Connected");

    // 기존 포켓몬 데이터 삭제
    await Pokemon.deleteMany({});
    console.log("Old Pokemon data removed");

    // 새 데이터 삽입
    await Pokemon.insertMany(pokemonData);
    console.log("Pokemon data inserted successfully!");

    mongoose.disconnect();
  } catch (err) {
    console.error("Error seeding Pokemon data:", err);
    mongoose.disconnect();
  }
}

seedPokemon();
