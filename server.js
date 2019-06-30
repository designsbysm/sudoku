require("dotenv")
  .config();

const environment = process.env.SERVER_ENV;
const port = process.env.SERVER_PORT;

const fs = require("fs");
if (!fs.existsSync("./.env") || !environment || !port) {
  console.error("Exiting: missing .env config/options");
  process.exit(1);
}

const express = require("express");
const path = require("path");
const app = express();

app.use(express.static(path.join(__dirname, "build")));
app.get("*", function(req, res) {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(port, () => {
  console.info("%s server listening on %d", environment, port);
});
