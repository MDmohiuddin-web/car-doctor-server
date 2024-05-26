const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();

const port = process.env.PORT || 3000;

//middleware
app.use(cors());
app.use(express.json());

// ************* mongodb code start ***********//
console.log(
  `server DB_username = ${process.env.DB_username} server DB_password = ${process.env.DB_password}`
);
// const uri = "mongodb+srv://car-Docter:kgF3fXhIVnrfHUVZ@cluster0.cg8xo0z.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const uri = `mongodb+srv://${process.env.DB_username}:${process.env.DB_password}@cluster0.cg8xo0z.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    //serviceCollection data base name is Car-Doctor
    const serviceCollection = client.db("Car-Doctor").collection("services");
    const BookServiceCollection = client.db("Car-Doctor").collection("bookings");

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
    app.post('/bookings', async (req, res) => {
      const booking = req.body;
      console.log(booking);
      const result = await BookServiceCollection.insertOne(booking);
      res.send(result);
    });
    // app.get("/bookings/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: new ObjectId(id) };

    //   const options = {
    //     // Sort matched documents in descending order by rating
    //     // sort: { "imdb.rating": -1 },
    //     // Include only the `title` and `imdb` fields in the returned document
    //     projection: { service_id: 1, title: 1, price: 1, img: 1 },
    //   };
    //   const result = await serviceCollection.findOne(query, options);
    //   res.send(result);
    // });


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
// *********mongodb code end  *********//

app.get("/", (req, res) => {
  res.send("Hello World! from server");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
