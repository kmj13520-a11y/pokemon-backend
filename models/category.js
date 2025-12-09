const mongoose = require("mongoose");

const TypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  color: {
    type: String, // 배경색 (#ff9800 같은)
  },
  icon: {
    type: String, // 타입 아이콘 URL
  },
});

module.exports = mongoose.model("Type", TypeSchema);
