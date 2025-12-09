const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  pokemons: [
    {
      pokemonId: {
        type: Number,
        required: true,
      },
      name_ko: {
        type: String,
        required: true,
      },
      image: {
        type: String,
        required: true,
      },
    },
  ],
});

module.exports = mongoose.model("Favorite", favoriteSchema);
