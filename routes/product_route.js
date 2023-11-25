const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const ProductModel = mongoose.model('ProductModel');
const FeaturedProductModel = mongoose.model('FeaturedProductModel')
const UserModel = mongoose.model('UserModel');
const protectedRoute = require('../middleware/protectedRoute');
const multer = require('multer');
const path = require('path'); // Import the 'path' module
const fs = require('fs'); // Import the 'fs' module to create the directory if it doesn't exist

// Define the storage strategy for multer to save files to the './uploads' folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Set the destination folder
    const uploadDirectory = path.resolve(__dirname, '..', './uploads'); // Resolve the path
    if (!fs.existsSync(uploadDirectory)) {
      fs.mkdirSync(uploadDirectory);
    }
    cb(null, uploadDirectory);
  },
  filename: (req, file, cb) => {
    // Use the original filename
    const filename = file.originalname;
    cb(null, filename);
  },
});

// Initialize multer with the storage strategy
const upload = multer({ storage });

router.post('/addproduct', upload.single('productImage'), async (req, res) => {
  const { productName, productPrice, productDescription } = req.body;

  if (!productName || !productPrice || !productDescription) {
    console.log('Missing fields');
    return res.status(400).json({ message: 'One or more fields are empty' });
  }

  try {
    const imageLocation = `/uploads/${req.file.filename}`; // Construct the URL
    const productObj = new ProductModel({
      productName,
      productPrice,
      productDescription,
      productImage: imageLocation, // Store the URL in the productImage field
      cartQuantity: 1
    });

    const newProduct = await productObj.save();
    console.log('Product added');
    res.status(201).json({ product: newProduct });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while adding the product' });
  }
});
router.post('/addfeatured', upload.single('productImage'), async (req, res) => {
  const { productName, productPrice, productDescription } = req.body;

  if (!productName || !productPrice || !productDescription) {
    console.log('Missing fields');
    return res.status(400).json({ message: 'One or more fields are empty' });
  }

  try {
    const imageLocation = `/uploads/${req.file.filename}`; // Construct the URL
    const productObj = new FeaturedProductModel({
      productName,
      productPrice,
      productDescription,
      productImage: imageLocation, // Store the URL in the productImage field
      cartQuantity: 1
    });

    const newProduct = await productObj.save();
    console.log('Product added');
    res.status(201).json({ product: newProduct });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while adding the product' });
  }
});


router.get('/getfeatured', async (req, res) => {
  try {

    const products = await FeaturedProductModel.find()

    res.status(200).json({ products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while fetching products' });
  }
});



router.post('/addtocart/:useremail', async (req, res) => {
  try {
    const { useremail } = req.params;
    const { product } = req.body;

    // Find the user by their email
    const user = await UserModel.findOne({ email: useremail });

    if (!user) {
      console.log("User not found");
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the product is already in the user's cart
    const isProductInCart = user.cart.some(cartProduct => cartProduct.productName === product.productName);

    if (isProductInCart) {
      console.log("Product is already in the cart");
      return res.status(400).json({ error: 'Product is already in the cart' });
    }

    // Add the product to the user's cart
    user.cart.push(product);

    // Save the user with the updated cart
    await user.save();
    console.log(user.cart);

    console.log("Added to cart");
    return res.status(200).json({ message: 'Product added to cart' });
  } catch (error) {
    console.error("Failed to add to cart:", error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});



// Define the IST timezone
const istTimeZone = 'Asia/Kolkata'; // IST timezone

router.post('/orderFinal/:userCart/:useremail', async (req, res) => {
  try {
    const { useremail, userCart } = req.params;

    // Find the user by their email
    const user = await UserModel.findOne({ email: useremail });

    if (!user) {
      console.log("User not found");
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove products from the user's cart and add them to the orders array
    const removedProducts = [];
    user.cart = user.cart.filter((product) => {
      if (userCart.includes(product)) {
        removedProducts.push(product);
        return false; // Exclude the product from the cart
      }
      return true; // Keep other products in the cart
    });

    // Create an Intl.DateTimeFormat object with the IST timezone
    const istFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: istTimeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3, // Include milliseconds
    });

    // Format the current date and time in IST
    const istDate = istFormatter.format(new Date());

    // Save the removed products and IST formatted date in the orders array
    user.orders.push({
      products: removedProducts,
      date: istDate, // Save the date in IST format
    });

    // Save the updated user
    await user.save();

    return res.status(200).json({ message: 'Order placed' });
  } catch (error) {
    console.error("Failed to order:", error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});






router.get('/getcart/:useremail', async (req, res) => {
  try {
    const { useremail } = req.params;


    // Find the user by their email
    const user = await UserModel.findOne({ email: useremail });

    if (!user) {
      console.log("User not found");
      return res.status(404).json({ error: 'User not found' });
    }

    const usercart = user.cart
    // console.log(usercart)


    return res.status(200).json({ usercart, message: 'cart' });
  } catch (error) {
    console.error("Failed to add to cart:", error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/getorders/:useremail', async (req, res) => {
  try {
    const { useremail } = req.params;


    // Find the user by their email
    const user = await UserModel.findOne({ email: useremail });

    if (!user) {
      console.log("User not found");
      return res.status(404).json({ error: 'User not found' });
    }

    const userorders = user.orders
    // console.log(usercart)


    return res.status(200).json({ userorders, message: 'Product added to cart' });
  } catch (error) {
    console.error("Failed to add to cart:", error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/removepcart/:productName/:useremail', async (req, res) => { // Modified the route parameter to accept productName
  try {
    const productName = req.params.productName;

    // Find the user by their email
    const useremail = req.params.useremail

    const user = await UserModel.findOne({ email: useremail });

    if (!user) {
      console.log("User not found");
      return res.status(404).json({ error: 'User not found' });
    }

    const userCart = user.cart;

    // Remove the product from the user's cart
    const updatedCart = userCart.filter(item => item.productName !== productName);

    // Update the user's cart with the modified cart
    user.cart = updatedCart;
    await user.save();

    console.log("Product removed");

    return res.json({ success: true, message: 'Product removed successfully.' });
  } catch (error) {
    console.log(error);
    // Handle any errors here
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});



router.put('/cartplus/:productName/:useremail', async (req, res) => {
  try {
    const productName = req.params.productName;
    const useremail = req.params.useremail;

    // Find the user by their email
    const user = await UserModel.findOne({ email: useremail });

    if (!user) {
      console.log("User not found");
      return res.status(404).json({ error: 'User not found' });
    }

    const productIndex = user.cart.findIndex(item => item.productName === productName);

    if (productIndex === -1) {
      console.log("Product not found in user's cart");
      return res.status(404).json({ error: 'Product not found in user\'s cart' });
    }

    // Increment the quantity by 1
    user.cart[productIndex].cartQuantity += 1;

    // Save the updated user using findByIdAndUpdate
    await UserModel.findByIdAndUpdate(user._id, { cart: user.cart });

    usercart = user.cart

    console.log("Updated cart quantity");
    res.json({usercart}); // Return the updated cart

  }
  catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



router.put('/cartminus/:productName/:useremail', async (req, res) => {
  try {
    const productName = req.params.productName;
    const useremail = req.params.useremail;

    // Find the user by their email
    const user = await UserModel.findOne({ email: useremail });

    if (!user) {
      console.log("User not found");
      return res.status(404).json({ error: 'User not found' });
    }

    const productIndex = user.cart.findIndex(item => item.productName === productName);

    if (productIndex === -1) {
      console.log("Product not found in user's cart");
      return res.status(404).json({ error: 'Product not found in user\'s cart' });
    }

    // Decrement the quantity by 1

    if(user.cart[productIndex].cartQuantity == 1){
      res.json("Cannot be less than 1"); // Return the updated cart
    }

    user.cart[productIndex].cartQuantity -= 1;

    // Save the updated user using findByIdAndUpdate
    await UserModel.findByIdAndUpdate(user._id, { cart: user.cart });

    usercart = user.cart

    console.log("Updated cart quantity");
    res.json({usercart}); // Return the updated cart

  }
  catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.get('/getproducts', async (req, res) => {
  try {

    const products = await ProductModel.find()

    res.status(200).json({ products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while fetching products' });
  }
});

router.get('/getproductsforwomen', async (req, res) => {
  try {
    const products = await ProductModel.find({
      productDescription: { $regex: /women|womens/i } // i flag for case-insensitive search
    });

    res.status(200).json({ products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while fetching products' });
  }
});

router.get('/womendresses', async (req, res) => {
  try {
    const products = await ProductModel.find({
      productDescription: { $regex: /women dresses|women dress|dress for women|dresses for women|dresses for womens/i } // i flag for case-insensitive search
    });

    res.status(200).json({ products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while fetching products' });
  }
});

router.get('/womenpants', async (req, res) => {
  try {
    const products = await ProductModel.find({
      productDescription: { $regex: /women pants|women pant|pant for women|pants for women|pants for womens/i } // i flag for case-insensitive search
    });

    res.status(200).json({ products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while fetching products' });
  }
});

router.get('/womenskirts', async (req, res) => {
  try {
    const products = await ProductModel.find({
      productDescription: { $regex: /women skirts|women skirt|skirt for women|skirts for women|skirts for womens/i } // i flag for case-insensitive search
    });

    res.status(200).json({ products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while fetching products' });
  }
});



router.get('/getproductsformen', async (req, res) => {
  try {
    const products = await ProductModel.find({
      productDescription: { $regex: /\b(men|mens)\b/i } // i flag for case-insensitive search
    });

    res.status(200).json({ products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while fetching products' });
  }
});


router.get('/getproductsforkids', async (req, res) => {
  try {
    const products = await ProductModel.find({
      productDescription: { $regex: /kid|kids/i } // i flag for case-insensitive search
    });

    res.status(200).json({ products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while fetching products' });
  }
});


router.get('/menshirts', async (req, res) => {
  try {
    const products = await ProductModel.find({
      productDescription: { $regex: /mens shirts|men shirts|shirt for men|shirts for men|shirts for mens/i } // i flag for case-insensitive search
    });

    res.status(200).json({ products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while fetching products' });
  }
});

router.get('/menpants', async (req, res) => {
  try {
    const products = await ProductModel.find({
      productDescription: { $regex: /mens pants|men pants|pant for men|pants for men|pants for mens/i } // i flag for case-insensitive search
    });

    res.status(200).json({ products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while fetching products' });
  }
});

router.get('/menhoodies', async (req, res) => {
  try {
    const products = await ProductModel.find({
      productDescription: { $regex: /mens hoodies|men hoodies|hoodie for men|hoodies for men|hoodies for mens/i } // i flag for case-insensitive search
    });

    res.status(200).json({ products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while fetching products' });
  }
});



router.delete('/removeproduct/:productName', async (req, res) => { // Modify the route parameter to accept productName
  try {
    const productName = req.params.productName;

    const product = await ProductModel.findOneAndDelete({ productName });

    console.log(product)

    return res.json({ success: true, message: 'Product removed successfully.' });
  } catch (error) {
    console.log(error);
    // Handle any errors here
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

router.delete('/removefproduct/:productName', async (req, res) => { // Modify the route parameter to accept productName
  try {
    const productName = req.params.productName;

    const product = await FeaturedProductModel.findOneAndDelete({ productName });

    console.log(product)

    return res.json({ success: true, message: 'Product removed successfully.' });
  } catch (error) {
    console.log(error);
    // Handle any errors here
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});




module.exports = router;
