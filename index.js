const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken');
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.port || 5000;

// middleware
app.use(express.json());
app.use(cors({
  origin:[
    'http://localhost:5173',
    'http://localhost:5174'
  ],
  credentials:true
}));
app.use(cookieParser())

const logger=(req,res,next)=>{
  console.log(req.method,req.url)
  next()
}

const  verifyToken=(req,res,next)=>{
  const token=req.cookies?.token
  console.log('token in the middleware',token)
  if(!token){
    return res.status(401).send({message:'unauthorized access'})
  }
  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
    if(err){
      return res.status(401).send({message:'unauthorized access'})
    }
    req.user=decoded
    next()
  })
}


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
    // await client.connect();

    const ArtCollection = client.db("Art&CraftDB").collection("crafts");
    const categoryNameCollection = client
      .db("Art&CraftDB")
      .collection("categoryName");
    const categoryCollection = client.db("Art&CraftDB").collection("category");

    //auth related api
    app.post('/jwt',async(req,res)=>{
      const user=req.body
      console.log('user for token',user)
      const token=jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1h'})
      res.cookie('token',token,{
        httpOnly:true,
        secure:false,
        sameSite:'strict'
      }).send({success:true})
    })

    app.post('/logout',async(req,res)=>{
      res.clearCookie('token',{maxAge:0}).send({success:true})
    })

    //services related api
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

    app.get("/myCart/:email",logger,verifyToken, async (req, res) => {''
      // console.log('cookies',req.cookies?.token)
      console.log(req.params.email)
      console.log(req.user)
      if(req.params.email !== req.user.email){
        return req.status(403).send({message:'forbidden access'})
      }
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
          photo: updateCraft.photo,
          item_name: updateCraft.item_name,
          category_name: updateCraft.category_name,
          price: updateCraft.price,
          rating: updateCraft.rating,
          time: updateCraft.time,
          customization: updateCraft.customization,
          stock_status: updateCraft.stock_status,
          description: updateCraft.description,
        },
      };
      const result = await ArtCollection.updateOne(filter, updateData, options);
      res.send(result);
    });

    // get category name data

    app.get("/categoryName", async (req, res) => {
      const cursor = categoryNameCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    //get category data

    app.get("/category/:name", async (req, res) => {
      const name = req.params.name;
      const query = { subcategory_Name: name };
      const result = await categoryCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/categories/:catItem", async (req, res) => {
      const catItem = req.params.catItem;
      const query = { item_name: catItem };
      const result = await categoryCollection.findOne(query);
      res.send(result);
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
