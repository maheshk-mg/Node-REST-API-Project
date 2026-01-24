use("ecommerce");

db.products.find();

// db.products.updateOne({ name: "Wireless Mouse" }, { $set: { price: 0 } });

// db.products.updateMany({ category: "Mobile" }, { $inc: { price: 99999 } });
// also use $set change price

// db.products.updateMany({
//   name: "Wireless Mouse",
// },
// {$push:{tags:"new wire mouse with solid cable"}}
// );
