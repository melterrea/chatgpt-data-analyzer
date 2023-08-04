const express = require("express");
const router = express.Router();
const { queryDocs } = require("../services/indexService");

/* GET home page. */
router.get("/", (req, res) => {
  res.send("Hello World!");
});

router.post("/", async (req, res) => {
  const response = await queryDocs(req.body.query);
  res.send(response);
});

module.exports = router;
