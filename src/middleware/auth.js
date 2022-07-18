const jwt = require("jsonwebtoken");
const booksModel = require("../model/booksModel")
const mongoose = require("mongoose");




//================================================= Authentication ==================================================//


const authenticate = function (req, res, next) {
  try {
    let token = req.headers["x-api-key"];

    if (!token) return res.status(400).send({ status: false, message: "Enter token in header" });

    jwt.verify(token, "4A group", (error, decodeToken) => {
      if (error) {
        const message =
          error.message === "jwt expired" ? "Token is expired" : "Token is invalid"
        return res.status(401).send({ status: false, message })
      }
      req.userId = decodeToken.userId
      next();
    })
  }
  catch (err) {
    return res.status(500).send({ status: false, message: err.message })
  }
}







//================================================= Authorization ==================================================//


const authorise = async function (req, res, next) {
  try {
    let bookId = req.params.bookId

    if (!mongoose.isValidObjectId(bookId)) {
      return res.status(400).send({ status: false, message: "Use valid bookId" })
    }
    let book = await booksModel.findById(bookId)

    if (!book) {
      return res.status(404).send({ status: false, msg: "book does not exists" })
    }
    if (book.isDeleted) {
      return res.status(404).send({ status: false, msg: "book is already deleted" })
    }
    let id = book.userId

    if (req.userId != id) {
      return res.status(403).send({ status: false, msg: 'user logged is not allowed to modify the requested users data' })
    }
    next()
  }
  catch (error) {
    res.status(500).send({ msg: error.message })
  }
}


module.exports = { authenticate, authorise };