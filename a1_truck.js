require("dotenv").config({ path: __dirname + "/.env" });
require("./server/connection");
const morgan = require("morgan");
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const cors = require("cors");
const port = process.env.PORT;
const compression = require('compression');
const cronJob = require('node-cron');
const Bookings = require('./server/utils/Bookings/index');
const Common = require('./server/controllers/Common');

const app = express();

app.use(compression())

app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({ origin: "*" }));
app.use(express.static(path.join(__dirname, "./server/views")));
app.use("/files", express.static(__dirname + "/server/uploads"));

app.get("/", (req, res) => {
  res.sendFile(path.join("/index.html"));
});

//routers
const users = require("./server/routes/users");
const vehicles = require("./server/routes/vehicles");
const administration = require("./server/routes/administration");
const common = require("./server/routes/common");
const appdata = require("./server/routes/AppData");
const bookings = require("./server/routes/bookings");

app.use(process.env["API_V1"] + "admin", administration);
app.use(process.env["API_V1"] + "user", users);
app.use(process.env["API_V1"] + "vehicle", vehicles);
app.use(process.env["API_V1"] + "common", common);
app.use(process.env["API_V1"] + "appdata", appdata);
app.use(process.env["API_V1"] + "bookings", bookings);

// cronJob.schedule('* * * * * *', function () {
  // Bookings.autoUpdateBooking();
// });

// cronJob.schedule('* * * * * *', async function () {  // 2 hours prior booking ends.
  // await Common.fireNotificationOnDailyEvents();
// });

// cronJob.schedule('* * * * * *', function () {  // upcoming booking half an hour ago or 30 min before.
  // await Common.fireNotificationOnUpcomingEvent();
// });

// cronJob.schedule('* * * * * *', function () {  // 2 days prior notification of weekly and monthly plan ends.
  // await Common.fireNotificationOnWeeklyAndMonthlyEvent();
// });

app.listen(port, () => {
  console.log(`https server running on port ${port}`);
});