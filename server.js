require("dotenv").config();

const cron = require("node-cron");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const { connect: connectDB } = require("./lib/db");
const { fetchAndSaveTweets } = require("./lib/fetchTweets");

const categoriesRoutes = require("./routes/categories");
const tweetsRoutes = require("./routes/tweets");
const metaRoutes = require("./routes/meta");
const verificationRoutes = require("./routes/verification");

const app = express();

const PORT = process.env.PORT || 4000;

const swaggerDocs = swaggerJsDoc({
  swaggerDefinition: {
    info: {
      version: "1.0.0",
      title: "YellowJobs API",
      description: "YellowJobs API v1",
      contact: {
        name: "API Support",
        url: "",
      },
      servers: ["http://yellowjobs.org"],
    },
  },
  apis: ["routes/*.js"],
});

app.use(morgan(process.env.NODE_ENV == "production" ? "common" : "dev"));
app.use(express.json());

app.options("/volunteer/*", cors());
app.use(cors());

app.use("/api", tweetsRoutes);
app.use("/api", categoriesRoutes);
app.use("/api", metaRoutes);
app.use("/api", verificationRoutes);

app.use("/", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
console.log(
  "⚠️Starting ",
  process.env.NODE_ENV == "production" ? "prod" : "staging",
  " Environment"
);

connectDB().then(() => {
  console.log("✅ Database Connected!");

  fetchAndSaveTweets();

  if (process.env.NODE_ENV === "production") {
    cron.schedule("*/1 * * * *", async () => {
      console.log("Fetching Tweets...");
      console.time("fetchTweets");

      await fetchAndSaveTweets();

      console.timeEnd("fetchTweets");
      console.log("Done Fetching Tweets!");
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log("🚀 Server Ready! at port:", PORT);
  });
});
