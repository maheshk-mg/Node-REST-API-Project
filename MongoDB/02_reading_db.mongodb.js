use("ecommerce");

db.products.find();
// db.products.find().pretty()
// db.products.find().countDocuments()
// db.orders.find().countDocuments()

// db.products.find({ category: "Mobile" });
// db.products.find({ price: { $gt: 50000 } });
// db.products.find({ price: { $gte: 30000, $lte:70000 } });

// db.products.find({
//   $or: [{ stock: { $lte: 8 } }, { categoey: "Electronics" }],
// });

// db.products.find({
//   stock: { $gte: 5 },
//   category: "Electronics",
// });

// specific field need
// db.products.find({}, { name: 1, price: 1, _id: 0 });
// db.products.find(
//   {},
//   {
//     name: 1,
//     price: 1,
//     category: 1,
//     stock: 1,
//     ratings: 1,
//     _id: 0,
//   },
// );

//Paginations
// db.products.find().sort({ price: -1 }).skip(4).limit(10);

// db.contacts.find()
// db.contacts.find().pretty()

// db.orders.find()
// db.orders.find().pretty()
