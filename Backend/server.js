const app = require("./src/app")
const connetDB = require("./src/DB/db");
require("dotenv").config();

connetDB();



app.listen(3000, () => {
    console.log("Server is running on Port no 3000..!")
})