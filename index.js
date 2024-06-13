const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();

const port = process.env.PORT || 3000;

//middleware
app.use(
  cors({
    origin: ["http://localhost:4000"], 
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// ************* mongodb code start ***********//
console.log( 
  `server DB_username = ${process.env.DB_username} server DB_password = ${process.env.DB_password}`
);
const uri = `mongodb+srv://${process.env.DB_username}:${process.env.DB_password}@cluster0.cg8xo0z.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

//middleware
const logger = async (req, res, next) => {
  console.log("request made", req.host, req.originalUrl);
  // console.log("request made",req.method,req.url);
  next();
};
const verifyToken = async (req, res, next) => {
  const token = req.cookies["token"];
  if (!token) {
    return res.status(401).send("unauthorized");
  }
  jwt.verify(token, process.env.ACCESS_KEY, (err, user) => {
    if (err) {
      console.log(err);
      return res.status(401).send({ message: "unauthorized" });
    }
    console.log("value in the token", decoded);
    req.user = decoded;
    next();
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    //serviceCollection data base name is Car-Doctor
    const serviceCollection = client.db("Car-Doctor").collection("services");
    const BookServiceCollection = client
      .db("Car-Doctor")
      .collection("bookings");

    //auth related api
    // app.post("/jwt", async (req, res) => {
    //   try {
    //     const user = req.body;
    //     console.log(user);
    //     const token = jwt.sign(user, process.env.ACCESS_KEY, { expiresIn: "1h" });
    //     console.log(token);

    //     res
    //       .cookie("token", token, {
    //         httpOnly: true,
    //         secure: false,
    //         sameSite: "none",
    //         // maxAge: 3600000,
    //       })
    //       .send({ success: true });

    //
    // app.post('/jwt', async (req, res) => {
    //   const user = req.body
    //   const token = jwt.sign(user, process.env.ACCESS_KEY, {
    //   expiresIn: '365d',
    //   })
    //   res
    //   .cookie('token', token, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === 'production',
    //   sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    //   })
    //   .send({ success: true })
    //   })

    app.post("/jwt", logger, async (req, res) => {
      const user = req.body;
      console.log("user for token", user);
      const token = jwt.sign(user, process.env.ACCESS_KEY, { 
        expiresIn: "1h",
      });

      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true, 
          sameSite: "none",
        })  
        .send({ success: true });      
    })
    

    app.get("/services", async (req, res) => {
      const result = await serviceCollection.find().toArray();
      res.send(result);
    });

    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const options = {
        // Sort matched documents in descending order by rating
        // sort: { "imdb.rating": -1 },
        // Include only the `title` and `imdb` fields in the returned document
        projection: { service_id: 1, title: 1, price: 1, img: 1 },
      };
      const result = await serviceCollection.findOne(query, options);
      res.send(result);
    });

    //BookingService

    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      console.log(booking);
      const result = await BookServiceCollection.insertOne(booking);
      res.send(result);
    });

    app.get("/bookings", async (req, res) => {
      console.log(req.query.email);
      console.log("cookies", req.cookies.token);
      let query = {};
      if (req.query?.email) {
        query = {
          email: req.query.email,
        };
      }
      const result = await BookServiceCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await BookServiceCollection.findOne(query);
      res.send(result);
    });
    app.patch("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedBooking = req.body;
      console.log(updatedBooking);
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          status: updatedBooking.status,
        },
      };

      const result = await BookServiceCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    app.delete("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await BookServiceCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World! from server");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
