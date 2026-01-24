use("ecommerce");

db.sales.find();

// db.sales.aggregate([
//   { $match: { category: "Fruit" } },
//   { $project: { _id: 0, item: 1, quantity: 5 } },
// ]);

// db.sales.aggregate([
//   {
//     $group: {
//       _id: "$category",
//       totalSales: { $sum: { $multiply: ["$price", "$quantity"] } },
//     },
//   },
//   {
//     $group: {
//       _id: 0,
//       TotalSaleAmout: { $sum: "$totalSales" },
//     },
//   },
// ]);

db.sales.aggregate([
  {
    $group: {
      _id: "$category",
      totalSales: { $sum: { $multiply: ["$price", "$quantity"] } },
    },
  },
  {
    $group: {
      _id: null,
      categories: { $push: "$$ROOT" },
      totalSum: { $sum: "$totalSales" },
    },
  },
]);
