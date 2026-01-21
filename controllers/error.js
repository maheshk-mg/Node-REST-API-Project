exports.get404 = (req, res, next) => {
  res.status(404).json({
    status: 404,
    message: "Route not found",
  });
};

exports.get500 = (req, res, next) => {
  res.status(500).json({
    status: 500,
    message: "Internal server error",
  });
};