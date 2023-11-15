const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
require('dotenv').config()
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.obhaluk.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);

const stripe = require("stripe")(process.env.SECRET_KEY)


async function run() {
    try {
        client.connect()
        const database = client.db('online_shop')
        const productsCollection = database.collection('products')
        const orderCollection = database.collection('orders')
        const adminCollection=database.collection('admin')



        app.post("/create-payment-intent", async (req, res) => {
            const { amount } = req.body;
            
            // Create a PaymentIntent with the order amount and currency
            const paymentIntent = await stripe.paymentIntents.create({
                amount: parseInt(amount),
                currency: "usd",

                automatic_payment_methods: {
                    enabled: true,
                },

            });
       
            
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });


        // app.post("/orders", async (req, res) => {

        // })



        app.get('/products', async (req, res) => {

            const cursor = await productsCollection.find({})
            const page = req.query.page;
            const size = parseInt(req.query.size);
            let products;
            const count = await cursor.count();
            if (page) {
                products = await cursor.skip(page * size).limit(size).toArray();
            }
            else {
                products = await cursor.toArray()
            }


            res.send({ count, products })
            // const name="kakakf"
            // res.send(name)
        })

        //Use POST to get data by keys
        app.post('/products/byKeys', async (req, res) => {
            const keys = req.body
            const query = { key: { $in: keys } }
            const products = await productsCollection.find(query).toArray()
            res.json(products)
        })


        app.post('/inventory', async (req, res) => {
            const product = req?.body
            
            const products = await productsCollection.insertOne(product)
           

            res.send(products)

        })
        //Add Orders API
        app.post('/order', async (req, res) => {
            const order = req?.body;
            const result = await orderCollection.insertOne(order)
            res.json(result)

        })
        app.post('/admin/:email',async(req,res)=>{
            const email=req?.params?.email;
            const admin= await adminCollection.insertOne(email)
            res.json(admin)


        })
        app.get('/admin/:email',async(req,res)=>{
            const email=req?.params?.email;
          
            const emailObject={email:email}
         
            const admin= await adminCollection.findOne(emailObject)
       
           
            res.json(admin)


        })
        app.get('/orders',async(req,res)=>{

            const orders=await orderCollection.find().toArray()

            res.send(orders)

        })


        app.delete('/product/:id', async (req, res) => {
            const id = req?.params?.id;
            const product = { _id: new ObjectId(id) };
            console.log(product)
            const result = await productsCollection.deleteOne(product);
            console.log(result)
            res.send(result)
        })
        app.delete('/orders/:id', async (req, res) => {
            const id = req?.params?.id;
            const order = { _id: new ObjectId(id) };
          
            const result = await orderCollection.deleteOne(order);
          
            res.send(result.acknowledged)
        })



    }
    finally {
        //await client.close()
    }

}
run().catch(console.dir)



app.get('/', (req, res) => {
    res.send('abar hojoborol');
})

app.listen(port, () => {
    console.log('Server running')
})

