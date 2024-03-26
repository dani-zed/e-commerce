var express = require("express");
// const {render} = require('../app')
var router = express.Router();
var productHelper = require("../helpers/product-helpers");
const path = require('path');
// const productHelpers = require("../helpers/product-helpers");
const adminHelper = require("../helpers/admin-helpers");
const adminHelpers = require("../helpers/admin-helpers");
const { log } = require("console");
/* GET users listing. */
const checkAdminLogin = (req, res, next) => {
  if (adminHelpers.checkAdminLogin(req)) {
    next();
  } else {
    res.redirect('/admin/login');
  }
};

// home page
router.get("/",checkAdminLogin, function (req, res, next) {
  let admin=req.session.admin;
  productHelper.getAllProducts().then((products)=>{
    res.render("admin/prod-preview", { admin: true, products ,admin });
  })
});
//adding code 


router.get('/login', (req, res) => {
  if (req.session.admin && req.session.admin.loggedIn) {
    res.redirect('/admin');//directing to home page
  } else {
    res.render('admin/login', { admin: true,'loginErr': req.session.adminLoginErr });
    req.session.adminLoginErr = false;
  }
});

router.post('/login', async (req, res) => {
  adminHelper.doLoginAdmin(req.body).then((response) => {
    if (response.status) {
      req.session.admin = response.admin;
      req.session.admin.loggedIn = true;
      res.redirect('/admin');
    } else {
      req.session.adminLoginErr = 'Invalid username or password';
      res.redirect('/admin/login');
    }
  });
});

router.get('/signup', (req, res) => {
  res.render('admin/signup',{admin: true});
});

router.post('/signup', (req, res) => {
  adminHelper.doSignupAdmin(req.body).then((response) => {
    if (response.status) {
      req.session.admin = response.admin;
      req.session.admin.loggedIn = true;
      res.redirect('/admin');
    } else {
      console.error("Error during admin signup:", response.message);
      res.status(500).send('Failed to sign up');
    }
  }).catch((error) => {
    console.error("Error during admin signup:", error);
    res.status(500).send('Failed to sign up');
  });
});

router.get('/logout', (req, res) => {
  req.session.admin = null;
  res.redirect('/');
});



//adding code
router.get("/manage",function (req, res) {
  let admin=req.session.admin;
  productHelper.getAllProducts().then((products)=>{
    res.render("admin/manage-prods", { admin: true, products ,admin });
  })
});


router.get("/all-products",function (req, res) {
  let admin=req.session.admin;
  productHelper.getAllProducts().then((products)=>{
    res.render("admin/view-products", { admin: true, products ,admin });
  })
});

router.get("/profile",checkAdminLogin, (req, res) => {
  res.render("admin/profile",{user:false});
});

// router.get('/view/:id', async (req, res) => {
//   let admin=req.session.admin;
//   try {
//       // Retrieve the product details based on the ID
//       const productId = req.params.id;
//       const product = await productHelper.getProductDetails(productId);
//       res.render('admin/product', {admin:true, product,admin });
//   } catch (error) {
//       console.error('Error in /the-product route:', error);
//       res.status(500).send('Internal Server Error');
//   }
// });
// router.get('/view/:id',async(req,res)=>{
//   let product = await productHelper.getProductDetails(req.params.id)
//   res.render('admin/product',{product})
// })



router.get("/add-product", (req, res) => {
  res.render("admin/add-product",{admin:true});
});

router.post("/add-product", async (req, res) => {
  try {
    const id = await new Promise((resolve, reject) => {
      productHelper.addProduct(req.body, (id) => {
        resolve(id);
      });
    });

    if (id) {
      let image = req.files.image;
      let imagePath = path.join(__dirname, '../public/product-images/', id + '.jpg');

      await new Promise((resolve, reject) => {
        image.mv(imagePath, (err, done) => {
          if (!err) {
            resolve();
          } else {
            console.log(err);
            reject(err);
          }
        });
      });

      res.render("admin/add-product",{admin:true});
    } else {
      console.log("Error adding product");
      res.render("admin/add-product", {admin: true, error: "Failed to add product" });
    }
  } catch (error) {
    console.log(error);
    res.render("admin/add-product", { admin: true,error: "Failed to upload image" });
  }
});

router.get('/delete-product/:id',(req,res)=>{
  let productId = req.params.id 
  console.log(productId)
  productHelper.deleteProduct(productId).then((response)=>{
    res.redirect('/admin/')
  })
})

router.get('/edit-product/:id',async(req,res)=>{
  let product = await productHelper.getProductDetails(req.params.id)
  res.render('admin/edit-product',{admin:true,product})
})

router.post('/edit-product/:id',(req,res)=>{
  let id = req.params.id
  productHelper.updateProduct(req.params.id,req.body).then(()=>{

    res.redirect(302, '/admin');



    if(req.files.image){  
      let image = req.files.image
      image.mv('./public/product-images/'+id+'.jpg');  
    }
  })
})

// router.get("/profile", (req, res) => {
//   res.render("admin/profile",{admin:true});
// });

module.exports = router;
