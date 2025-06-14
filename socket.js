import { Server as SocketIOServer} from "socket.io" //to create websocket server on top of http server

const setupSocket = (server) => { //takes already running http server and adds websocket support
    const io = new SocketIOServer(server, { //creates new websocket server bound to our http server
        cors: {
            origin: process.env.ORIGIN, //allows req from frontend only
            methods: ["GET", "POST"],
            credentials: true
        }
    })
    const userSocketMap = new Map(); //map to track users and their sockets userId->socketid


    const disconnect = (socket) => {
        console.log(`Client disconnected: ${socket.id}`)
        for(const [userId,socketId] of userSocketMap.entries()){//finds user who was using the socket to be deleted and removes the entry from userSocketMap
            if(socketId === socket.id){
                userSocketMap.delete(userId)
                break
            }
        }
    }
    //runs everytime a new client connects to the backend via websockets
    io.on("connection",(socket) => {
        const userId = socket.handshake.query.userId; //frontend needs to send userId in query

        if(userId){
            userSocketMap.set(userId, socket.id); //store user-socket mapping for later use like sending message
            console.log(`User ${userId} connected with socket id ${socket.id}`);
        } else{
            console.log("User id not provided during connection");
        }

        socket.on("disconnect", ()=>disconnect(socket))
    })
}

export default setupSocket