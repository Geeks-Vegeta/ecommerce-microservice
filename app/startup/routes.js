const authRouter = require("../modules/user/auth/routes");
const path = "ecommerce";

module.exports = async function (app) {
  app.use(`/${path}/api/auth`, authRouter);
};
