require('dotenv').config()
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const upload = require('express-fileupload')
const userRoutes = require('./routes/userRoutes')
const postRoutes = require('./routes/postRoutes')

const { notFound, errorHandler } = require('./middleware/errorMiddleware')

const app = express();

app.use(express.json({ extended: true }))
app.use(express.urlencoded({ extended: true }))

app.use(cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
}))

app.get("/", function (req, res) {
    res.send("Successful!!");
})

app.use(upload())
app.use('/uploads', express.static(__dirname + '/uploads'))

//user routes
app.use('/api/users', userRoutes)
//post routes
app.use('/api/posts', postRoutes)


app.use(notFound);
app.use(errorHandler);


// mongoose.connect(process.env.MONGO_URI)
//     .then(() => {
//         console.log("MongoDB Connected!");
//         app.listen(process.env.PORT, () => {
//             console.log(`Server is running on port ${process.env.PORT}`);
//         });
//     })
//     .catch((err) => {
//         console.error("Error while connecting to MongoDB:", err);
//     });



/////another way
async function connectMongodb() {
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log("Mongo db is connected");
        startServer();
    }
    catch (err) {
        console.log("Error while connecting to mongodb", err);
    }
}

function startServer() {
    app.listen(process.env.PORT, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    })
}

connectMongodb();


// very very very very important line, we need to add this if we try to deploy the server in vercel
module.exports = app;