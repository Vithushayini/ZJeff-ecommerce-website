const Product=require('../models/productModel');
const ErrorHandler=require('../utils/errorHandler');
const catchAsyncError=require('../middlewares/catchAsyncError');
const APIFeatures=require('../utils/apiFeatures');

//Get Products-{{base_url}}/api/v1/products
exports.getProducts=catchAsyncError(async (req,res,next)=>{
   const resPerPage=3;
   
   let buildQuery=()=>{
    return new APIFeatures(Product.find(), req.query).search().filter()
   }

   const filteredProductsCount=await buildQuery().query.countDocuments({});
   const totalProductsCount= await Product.countDocuments({});
   let productsCount=totalProductsCount;

   if(filteredProductsCount !== totalProductsCount){
    productsCount=filteredProductsCount;
   }

  const products=await buildQuery().paginate(resPerPage).query;
  
  //await new Promise(resolve=>setTimeout(resolve,3000)) //products will display after 3 secs

  res.status(200).json({
    success:true,
    count: productsCount,
    resPerPage,
    products
  })
});

//Create Product-{{base_url}}/api/v1/product/new
exports.newProduct=catchAsyncError(async (req,res,next)=>{
    let images=[];

    if(req.files.length > 0){
      req.files.forEach(file =>{
        let url= `${process.env.BACKEND_URL}/uploads/product/${file.originalname}`;
        images.push({image:url})
      })
    }

    req.body.images=images;

    req.body.user=req.user.id
    const product=await Product.create(req.body);
    res.status(201).json({
      success:true,
      product//product:product num kudukalam
    })
});

//Get Single Product-{{base_url}}/api/v1/product/:id
exports.getSingleProduct=catchAsyncError(async (req,res,next)=>{
    const product=await Product.findById(req.params.id).populate('reviews.user', 'name email');

    if(!product){
     return next(new ErrorHandler('product not found vithu',400));
      
      // return res.status(404).json({
      //   success:false,
      //   message:"Product not found"
      // })
      
    }

    res.status(201).json({
      success:true,
      product
    })
});


//Update Product-{{base_url}}/api/v1/product/:id
exports.updateProduct=catchAsyncError(async(req,res,next)=>{
 let product=await Product.findById(req.params.id);

 //uploading images
 let images=[];

 if(req.body.imagesCleared === 'false'){
  images= product.images;
 }

 //if images not cleared we keep existing images
    if(req.files.length > 0){
      req.files.forEach(file =>{
        let url= `${process.env.BACKEND_URL}/uploads/product/${file.originalname}`;
        images.push({image:url})
      })
    }

    req.body.images=images;

 if(!product){
  return res.status(404).json({
    success:false,
    message:"Product not found"
  })
}

product=await Product.findByIdAndUpdate(req.params.id,req.body,{
   new:true,
   runValidators:true
})

res.status(200).json({
  success:true,
  product
})

})

//Delete Product-{{base_url}}/api/v1/product/:id
exports.deleteProduct=async(req,res,next)=>{
  const product=await Product.findById(req.params.id);

    if(!product){
      return res.status(404).json({
        success:false,
        message:"Product not found"
      });
    }

    await product.deleteOne();

    res.status(200).json({
      success:true,
      message:"Product Deleted"
    })
}



//Create Review -{{base_url}}/api/v1/review
exports.createReview=catchAsyncError(async (req,res,next)=>{
  const {productId, rating, comment}=req.body;

  const review={
    user:req.user.id,
    rating,
    comment
  }

  const product=await Product.findById(productId);
  console.log(product.name);

  //finding is user already has review
 const isReviewed = product.reviews.find(review=>{
    return review.user.toString()==req.user.id.toString() 
  })


  if(isReviewed){
    //updating the review
    product.reviews.forEach(review=>{
      if(review.user.toString()==req.user.id.toString()){
        review.comment=comment,
        review.rating=rating
      }

    })

  }else{
    //creating the review
    product.reviews.push(review);
    product.numofReviews=product.reviews.length;
  }

  //find the average of the product reviews(ratings)
  product.ratings =product.reviews.reduce((acc,review)=>{
    return review.rating +acc;
  },0)/product.reviews.length;
  product.ratings = isNaN(product.ratings)?0:product.ratings;

  await product.save({validateBeforeSave:false});

  res.status(200).json({
    success:true
  })
})


//Get Reviews - {{base_url}}/api/v1/reviews?id={productId}
exports.getReviews=catchAsyncError(async(req,res,next)=>{
  const product = await Product.findById(req.query.id).populate('reviews.user','name email');

    res.status(200).json({
      success:true,
      reviews:product.reviews
    })
})


//Delete Reviews - {{base_url}}/api/v1/review
exports.deleteReview=catchAsyncError(async(req,res,next)=>{
  const product= await Product.findById(req.query.productId);

  if(!product){
    return res.status(404).json({
      success:false,
      message:"Product not found"
    });
  }

  //filtering the reviews which does not match the deleting review id
  const reviews=product.reviews.filter(review=>{
   return review._id.toString()!==req.query.id.toString()
  });

  //number of reviews
  const numofReviews=reviews.length;

  //findings the average with the filtered reviews
  let ratings=reviews.reduce((acc,review)=>{
    return review.rating +acc;
  },0)/reviews.length;
  ratings=isNaN(ratings)?0:ratings;

  //saving the product document
  await Product.findByIdAndUpdate(req.query.productId, {
    reviews,
    numofReviews,
    ratings
  })
  res.status(200).json({
    success:true
  })
})


//get admin products -{{base_url}}/api/v1/admin/products
exports.getAdminProducts=catchAsyncError(async (req,res,next)=>{
  const products = await Product.find();
  res.status(200).send({
    success:true,
    products
  })
});