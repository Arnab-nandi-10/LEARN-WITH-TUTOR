require("dotenv").config();
const app = require("./app");
const connect_db = require("./configs/db");

const PORT = process.env.PORT || 5000;

connect_db()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("DB connection failed ❌", err);
    process.exit(1);
  });
