const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const { Sequelize, Op, Model, DataTypes } = require("sequelize");
const { starbuzzcoffee } = require('./models')
const { cart } = require('./models')
const ejs = require("ejs");
const { users } = require('./models')
const bcrypt = require('bcrypt');
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const initializePassport = require('./passport-config');
const { add } = require('winston');
require('dotenv').config()
// Define the association between starbuzzcoffee model and cart model
starbuzzcoffee.hasMany(cart)
cart.belongsTo(starbuzzcoffee)
initializePassport(
    passport,
    email => users.findOne({ where: { email: email } }),
    id => users.findOne({ where: { id: id } })
)

app.set('view engine', 'ejs')
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize())
app.use(passport.session())

app.use(express.static("public"))
app.use(bodyParser.json())
app.use('/css', express.static(__dirname + 'public/css'))



// Use this function to bulk delete 
async function bulkDelete() {
    const product = await starbuzzcoffee.destroy({ where: { id: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19] } })
    console.log(product)
}
// bulkDelete()

// Render the home page
app.get('/home', async (req, res) => {
    const product = await starbuzzcoffee.findAll()
    res.render('index.ejs', { item: product })

})
// Render the create listing page
app.get('/createListing', (req, res) => {
    res.render('createListing')
})
// Render the product details page
app.get('/productDetails/:id', async (req, res) => {
    const id = req.params.id
    const products = await starbuzzcoffee.findOne({
        where: {
            id: id
        }
    })
    res.render('product-details', { product: products })
})

// Create a new product
app.post('/createListing', async (req, res) => {
    const { productName, price, description, imageurl } = req.body
    const newProduct = {
        productName: productName,
        price: price,
        description: description,
        imageurl: imageurl
    }
    await starbuzzcoffee.create(newProduct)
    res.redirect('/home')
})
app.get('/navbar', (req, res) => {

    res.render('partials/navbar')
})

app.get('/footer', (req, res) => {

    res.render('partials/footer')
})

// Render the cart page
app.get('/mycart', async (req, res) => {
    const addedToCart =
        await cart.findAll({
            include: [{ model: starbuzzcoffee }]
        })
    // res.send(myCart)
    res.render('mycart', { myCart: addedToCart })
})
// Add item to the cart
app.post('/add-to-cart/:id', async (req, res) => {
    const id = req.params.id
    const addedToCart = await cart.findOne({
        where: {
            id: id
        },
        include: starbuzzcoffee
    })
    console.log("++++++++", starbuzzcoffee.product)
    await cart.create(addedToCart)
    res.redirect('/home')
})
// Deleteing a cart item
app.post('/delete-cart/:id', async (req, res) => {
    const id = req.params.id
    const deleteCartItem = await cart.destroy({
        where: {
            id: id
        }
    })
    res.redirect('/mycart')
})

app.put('/', (req, res) => {

})

app.delete('/mycart/delete/:id', async (req, res) => {
    const id = req.params.id;
    let removeCoffee = await starbuzzcoffee.destroy({
        where: { id },
    });
    res.send(String(removeCoffee));
})


function calculateTotal(item, req) {
    total = 0;
    for (let i = 0; i < item.length; i++) {
        if (item[i].price) {
            total = total + (item[i].price * item[i] * quantity);
        }
    }
}

app.put('/mycart/change/:id', async (req, res) => {
    let myNewCoffee = await starbuzzcoffee.update(
        { productName: req.body.productName, price: req.body.price, description: req.body.description, imageurl: req.body.imageurl }, {
        where: {
            id: req.params.id,
        }
    });
    res.send(myNewCoffee)
})

app.get('/register', (req, res) => {
    res.render('register.ejs')
})

app.post('/register', async (req, res) => {

    bcrypt.hash(req.body.password, 10, async function (err, hash) {

        const post = await users.create({ name: req.body.name, email: req.body.email, password: hash });
        //const post = await users.create
        res.redirect('/login')
        //res.send(post)
    });
})

app.get('/login', (req, res) => {
    res.render('login.ejs')
})

app.post('/login', passport.authenticate('local', {
    successRedirect: '/home',
    failureRedirect: '/login',
    failureFlash: true
}))

app.listen(port = 3000, () => {
    console.log("App is running on port", port)
})
