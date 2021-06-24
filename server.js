require("dotenv").config();

const cron = require("node-cron");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const { fetchAndSaveTweets } = require("./fetchTweets");
const apiRoutes = require("./routes/apiRoutes");
//const meta = require("./routes/meta");

const app = express();

const DB_URL = process.env.MONGO_URI;
const PORT = process.env.PORT || 4000;

const swaggerOptions = {
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
  // ['.routes/*.js']
  apis: ["routes/apiRoutes.js", "routes/meta.js", "routes/volunteerRoutes.js"],
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);

app.use(morgan(process.env.NODE_ENV == "production" ? "common" : "dev"));
app.use(express.json());

app.options("/volunteer/*", cors());
app.use(cors());

app.use("/api", apiRoutes);
// app.use("/api", meta);
app.use("/", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

mongoose.connect(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
  console.log("✅ Database Connected!");

  fetchAndSaveTweets();

  if (process.env.NODE_ENV === "production") {
    cron.schedule("*/10 * * * *", async () => {
      console.log("Fetching Tweets...");
      console.time("fetchTweets");
      
      await fetchAndSaveTweets()
    
      console.timeEnd("fetchTweets");
      console.log("Done Fetching Tweets!");
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log("🚀 Server Ready!");
  });
});
