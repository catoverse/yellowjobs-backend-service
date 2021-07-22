require("dotenv").config();

const cron = require("node-cron");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const { fetchAndSaveTweets } = require("./fetchTweets");
const categoryController = require("./controllers/category");

const categoriesRoutes = require("./routes/categories");
const tweetsRoutes = require("./routes/tweets");
const metaRoutes = require("./routes/meta");
const verificationRoutes = require("./routes/verification");

const app = express();

const DB_URL = process.env.MONGO_URI;
const PORT = process.env.PORT || 6000;

const swaggerDocs = swaggerJsDoc({
  swaggerDefinition: {
    info: {
      version: "1.0.0",
      title: "YellowJobs API",
      description: "YellowJobs API Information",
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

mongoose
  .connect(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("✅ Database Connected!");

    fetchAndSaveTweets();

    if (process.env.NODE_ENV === "production") {
      cron.schedule("*/10 * * * *", async () => {
        console.log("Fetching Tweets...");
        console.time("fetchTweets");

        await fetchAndSaveTweets();

        console.timeEnd("fetchTweets");
        console.log("Done Fetching Tweets!");
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log("🚀 Server Ready!");
    });
    process.on("beforeExit", () => {
      categoryController.flush();
    });
  });
