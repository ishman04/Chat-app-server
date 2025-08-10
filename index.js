import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import mongoose from 'mongoose'
import authRoutes from './routes/authRoutes.js'
import path from 'path'

import setupSocket from './socket.js'
import messagesRoutes from './routes/messagesRoutes.js'
import channelRoutes from './routes/channelRoutes.js'
import contactRoutes from './routes/contactRoutes.js'


dotenv.config();
const app = express();
const port = process.env.PORT || 3001;
const databaseURL = process.env.DATABASE_URL

app.use(cors({
    // origin:'https://chat-app-client-kohl.vercel.app',
    origin: true,
    methods: ['GET','POST','PUT','PATCH','DELETE'],
    credentials: true
}))

app.use("/uploads",express.static(path.join(process.cwd(),"uploads")))

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }))

app.use('/api/auth',authRoutes);
app.use('/api/contacts',contactRoutes)
app.use('/api/messages',messagesRoutes)
app.use('/api/channels',channelRoutes)

const server = app.listen(port, ()=>{
    console.log(`Server is running on port ${port}`)
})
setupSocket(server)

mongoose
    .connect(databaseURL)
    .then(()=>console.log("DB connection successful"))
    .catch((err)=>console.log(err.message))