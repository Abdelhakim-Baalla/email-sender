import "dotenv/config";
import express from "express";

const app = express();
const port = process.env.PORT ?? 4859;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  // Provide quick confirmation in logs when the service boots.
  console.log(`Email sender service listening on port ${port}`);
});
