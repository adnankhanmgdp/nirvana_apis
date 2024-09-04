const express = require('express')
const path = require('path');
const cors = require('cors');
require('dotenv').config()
bodyParser = require('body-parser');
const database = require('./config/database');
const { userRoutes } = require('./routes/user');

const app = express()

database.connect();
app.use(express.json());
app.use(bodyParser({ limit: '100mb' }));
app.use(cors());
const filesPath = path.resolve(__dirname, 'files');
app.use('/uploads', express.static(filesPath));

app.get('/', (req, res) => {
    res.send("Root folder")
})

app.use("/client/api", userRoutes);

const server = app.listen(process.env.PORT, () => {
    console.log(`server is running at port ${process.env.PORT}`)
})