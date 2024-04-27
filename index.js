const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.port || 5000;

// middleware
app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vrdje6l.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

    const ArtCollection = client.db("Art&CraftDB").collection("crafts");

    //read data

    app.get("/crafts", async (req, res) => {
      const cursor = ArtCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    //read single data with id

    app.get("/crafts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await ArtCollection.findOne(query);
      res.send(result);
    });

    //read single data with email

    app.get("/myCart/:email", async (req, res) => {
      const result = await ArtCollection.find({
        user_email: req.params.email,
      }).toArray();
      res.send(result);
    });

    //create data

    app.post("/crafts", async (req, res) => {
      const craft = req.body;
      console.log(craft);
      const result = await ArtCollection.insertOne(craft);
      res.send(result);
    });

    //delete data

    app.delete("/crafts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await ArtCollection.deleteOne(query);
      res.send(result);
    });

    //update data
    app.put("/crafts/:id", async (req, res) => {
      const id = req.params.id;
      const updateCraft = req.body;
      // console.log(id,updateCraft)
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateData = {
        $set: {
          photo:updateCraft.photo,
          item_name:updateCraft.item_name,
          category_name:updateCraft.category_name,
          price:updateCraft.price,
          rating:updateCraft.rating,
          time:updateCraft.time,
          customization:updateCraft.customization,
          stock_status:updateCraft.stock_status,
          description:updateCraft.description
        },
      };
      const result=await ArtCollection.updateOne(filter,updateData,options)
      res.send(result)
    });

    // Send a ping to confirm a successful connection
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Painting and Drawing");
});

app.listen(port, () => {
  console.log(`Painting and Drawing server listening on port ${port}`);
});
