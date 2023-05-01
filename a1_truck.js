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

const expressWiston = require('express-winston');
const { transports,format } = require('winston');
// require('winston-mongodb');
const db = require('./server/connection/index');

const app = express();

// **********Logging Start*********
app.use(expressWiston.logger({
  transports:[
      new transports.File({
          level:'warn',
          filename:'logs/logWarning.log'
      }),
      new transports.File({
          level:'error',
          filename:'logs/logError.log'
      }),
      new transports.File({
          level:'info',
          filename:'logs/logInfo.log'
      }),
      new transports.File({
          level:'http',
          filename:'logs/logHttp.log'
      }),
      new transports.File({
          level:'verbose',
          filename:'logs/logVerbose.log'
      }),
      new transports.File({
          level:'debug',
          filename:'logs/logDebug.log'
      }),
      new transports.File({
          level:'silly',
          filename:'logs/logSilly.log'
      }),
      // new transports.MongoDB({
      //   db : db,
      //   collection: 'mylogs'
      // })
  ],
  format:format.combine(
      format.json(),
      format.timestamp(),
      format.metadata(),
      format.prettyPrint()
  ),
  statusLevels:true
}))
app.use(expressWiston.errorLogger({
  transports:[
      new transports.File({
          level:'error',
          filename:'logs//logInternalError.log'
      }),      
  ],
  format:format.combine(
      format.json(),
      format.timestamp()
  ),
  statusLevels:true
}))
// **********Logging End*********

app.use(compression());

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

cronJob.schedule('0 */1 * * * *', async function () {  // expire job on expiration.
  await Bookings.autoUpdateBooking();
});

cronJob.schedule('0 */1 * * * *', async function () {  // 2 hours prior booking ends for daily booking.
  await Common.fireNotificationOnDailyEvents();
});

cronJob.schedule('0 */1 * * * *', async function () {  // upcoming booking half an hour ago or 30 min before.
  await Common.fireNotificationOnUpcomingEvent();
});

cronJob.schedule('0 13 */1 * * *', async function () {  // 2 days prior notification of weekly and monthly plan ends.
  await Common.fireNotificationOnWeeklyAndMonthlyEvent();
});

cronJob.schedule('0 */5 * * * *', async function () { // notification fire every 5 min on active bookings.
  await Common.fireNotificationOnActiveBookings();
});

app.listen(port, () => {
  console.log(`https server running on port ${port}`);
});