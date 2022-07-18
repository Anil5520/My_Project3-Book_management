const booksModel = require("../model/booksModel");
const userModel = require("../model/userModel")
const reviewModel = require("../model/reviewModel");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId
const aws = require("aws-sdk")


//functions for book validation
const isValid = function (data) {
  if (typeof data === "undefined" || typeof data === "number" || data === null) return false
  if (typeof data === "string" && data.trim().length === 0) return false
  return true;
}

const releasedAtregex = function (val) {
  let regx = /^([12][0-9]{3})\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|[3][01])$/;
  return regx.test(val.trim())
}


// AWS
aws.config.update({
  accessKeyId: "AKIAY3L35MCRVFM24Q7U",
  secretAccessKey: "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",
  region: "ap-south-1"
})

let uploadFile = async (file) => {
  return new Promise(function (resolve, reject) {
    // this function will upload file to aws and return the link
    let s3 = new aws.S3({ apiVersion: '2006-03-01' }); // we will be using the s3 service of aws

    var uploadParams = {
      ACL: "public-read",
      Bucket: "classroom-training-bucket",  //HERE
      Key: "anil/" + file.originalname, //HERE 
      Body: file.buffer
    }

    s3.upload(uploadParams, function (err, data) {
      if (err) {
        return reject({ "error": err })
      }
      console.log(data)
      console.log("file uploaded succesfully")
      return resolve(data.Location)
    })

  })
}



//========================================= 3-Create Book Api ==================================================//


const createBook = async function (req, res) {
  try {
    const data = req.body;

    const files = req.files
    if (files && files.length > 0) {
      //upload to s3 and get the uploaded link
      // res.send the link back to frontend/postman
      let uploadedFileURL = await uploadFile(files[0])
      data.bookCover = uploadedFileURL
    }
    else {
      res.status(400).send({ msg: "No file found" })
    }


    //Book validation start
    if (Object.keys(data).length == 0) {
      return res.status(400).send({ status: false, message: "Body cannot be empty" });
    }

    // Checks if title is empty or entered as a string or contains valid Title
    let title = data.title
    if (!isValid(title)) {
      return res.status(400).send({ status: false, message: "Please Enter valid Title" });
    }
    title = title.trim();
    let validTitle = /^\d*[a-zA-Z][a-zA-Z\d\s]*$/;
    if (!validTitle.test(title)) {
      return res.status(400).send({ status: false, message: "The Title may contain letters and numbers, not only numbers" });
    }
    // Checks whether title is present in book collection or not(for duplicate title)
    let duplicateTitle = await booksModel.findOne({ title: title });
    if (duplicateTitle) {
      return res.status(400).send({ status: false, message: `${title} already exists` });
    }


    // Checks if excerpt is empty or entered as a string
    if (!isValid(data.excerpt)) {
      return res.status(400).send({ status: false, message: "Please Enter valid excerpt" });
    }
    data.excerpt = data.excerpt.trim();
    if (data.excerpt.length <= 10) {
      return res.status(400).send({ status: false, message: "The excerpt should contain at least 10 characters or more than 10" });
    }


    // Checks if userId is empty or contains valid userId
    let userId = req.body.userId;
    if (!isValid(userId)) {
      return res.status(400).send({ status: false, message: "Enter userId" });
    }
    if (!ObjectId.isValid(userId)) {
      return res.status(400).send({ status: false, message: "Please Enter userId as a valid objectId" });
    }
    //checking authorization
    if (userId != req.userId) {
      return res.status(403).send({ status: false, message: "Unauthorised access" })
    }
    // Checks whether userId is present in user collection or not
    let checkuserId = await userModel.findById(userId);
    if (!checkuserId) {
      return res.status(404).send({ status: false, message: "Entered user not found" });
    }


    // Checks if ISBN is empty or entered as a string or contains valid ISBN
    let ISBN = data.ISBN
    if (!isValid(ISBN)) {
      return res.status(400).send({ status: false, message: "Please Enter valid ISBN" });
    }
    ISBN = ISBN.trim();
    let validISBN = /^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$/;
    if (!validISBN.test(ISBN)) {
      return res.status(400).send({ status: false, message: "The ISBN may contain only numbers in string and of 13 digit only" });
    }
    // Checks whether ISBN is present in book collection or not(for duplicate ISBN)
    let duplicateISBN = await booksModel.findOne({ ISBN: ISBN });
    if (duplicateISBN) {
      return res.status(400).send({ status: false, message: `${ISBN} already exists` });
    }


    // Checks if category is empty or entered as a string or contains valid Category
    if (!isValid(data.category)) {
      return res.status(400).send({ status: false, message: "Please Enter valid Category" });
    }
    data.category = data.category.trim();
    let validCategory = /^\w[a-zA-Z\-]*$/;
    if (!validCategory.test(data.category)) {
      return res.status(400).send({ status: false, message: "The Category may contain only letters" });
    }


    // Checks if subCategory is empty or entered as a string or contains valid subCategory
    if (!isValid(data.subcategory)) {
      return res.status(400).send({ status: false, message: "Please Enter valid subcategory" });
    }
    if (data.subcategory) {
      if (Array.isArray(data.subcategory)) {
        req.body["subcategory"] = [...data.subcategory]
      }
      if (Object.prototype.toString.call(data.subcategory) === "[object String]") {
        let subcat = data.subcategory.split(",").map(x => x.trim())
        req.body["subcategory"] = subcat
      }
    }


    // Checks if releasedAt is empty or entered as a string or contains valid releasedAt
    if (!isValid(data.releasedAt)) {
      return res.status(400).send({ status: false, message: "releasedAt date must be present" })
    }
    if (data.releasedAt && !releasedAtregex(data.releasedAt)) {
      return res.status(400).send({ status: false, message: "releasedAt should be in YYYY-MM-DD format" })
    }


    //book creation
    let savedData = await booksModel.create(data)
    return res.status(201).send({ status: true, data: savedData })
  }
  catch (err) {
    console.log(err)
    return res.status(500).send({ status: false, msg: err.message })
  }
}



//========================================= 4-Get Books Api ==================================================//


const getBooks = async function (req, res) {
  try {
    let query = req.query;
    const { userId, category, subcategory } = query;

    let filter = { isDeleted: false }

    if (userId) {
      filter.userId = query.userId
      if (!ObjectId.isValid(userId)) {
        return res.status(400).send({ status: false, message: "not a valid userId" })
      }
    }
    if (category) {
      filter.category = query.category
    }
    if (subcategory) {
      filter.subcategory = query.subcategory
    }

    let getData = await booksModel.find(filter).select({ userId: 1, title: 1, excerpt: 1, category: 1, reviews: 1, releasedAt: 1 }).sort({ title: 1 })

    if (getData.length == 0) {
      return res.status(404).send({ status: false, msg: "No such document exist with the given attributes." });
    }
    res.status(200).send({ status: true, message: 'Books list', data: getData })
  }
  catch (err) {
    console.log(err)
    return res.status(500).send({ status: false, msg: err.message })
  }
}



//========================================= 5-Get Book by Id Api ================================================//


const getById = async function (req, res) {
  try {
    let id = req.params.bookId
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).send({ status: false, message: "Use valid bookId" })
    }
    let bookDetail = await booksModel.findOne({ _id: id, isDeleted: false })
    if (!bookDetail) {
      return res.status(404).send({ status: false, message: "Book is already deleted or no any document found" })
    }

    let object = {
      _id: bookDetail._id,
      title: bookDetail.title,
      excerpt: bookDetail.excerpt,
      userId: bookDetail.userId,
      category: bookDetail.category,
      subcategory: bookDetail.subcategory,
      isDeleted: bookDetail.isDeleted,
      reviews: bookDetail.reviews,
      releasedAt: bookDetail.releasedAt,
      createdAt: bookDetail.createdAt,
      updatedAt: bookDetail.updatedAt
    }

    let review = await reviewModel.find({ bookId: id, isDeleted: false }).select({ __v: 0, isDeleted: 0, updatedAt: 0, createdAt: 0 })
    if (review) {
      object.reviews = review.length;
    }
    object.reviewsData = review
    res.status(200).send({ status: true, message: 'Books list', data: object })
  }
  catch (err) {
    return res.status(500).send({ status: false, message: err.message })
  }
}



//========================================= 6-Update Book by id Api ==============================================//


const updateBooks = async function (req, res) {
  try {
    let bookId = req.params.bookId

    let { title, excerpt, releasedAt, ISBN } = req.body
    if (!isValidBody(req.body)) {
      return res.status(400).send({ status: false, message: "enter data to be updated" })
    }

    let book = await booksModel.findById(bookId)
    if (!book) {
      return res.status(404).send({ status: false, message: "Book is not present in db" })
    }
    if (book.isDeleted) {
      return res.status(400).send({ status: false, message: "Book is already deleted" })
    }

    let booktitle = await booksModel.findOne({ title: title })
    if (booktitle) {
      return res.status(400).send({ status: false, message: "Given Book title is already present, Please use Another one" })
    }

    let bookisbn = await booksModel.findOne({ ISBN: ISBN })
    if (bookisbn) {
      return res.status(400).send({ status: false, message: "Given isbn is already present, Please use Another one" })
    }

    if (isValid(title) && validTitle(title)) {
      book.title = title
    } else return res.status(400).send({ status: false, message: "enter valid title" })
    if (isValid(excerpt)) {
      book.excerpt = excerpt
    }
    if (isValid(releasedAt) && releasedAtregex(releasedAt)) {
      book.releasedAt = releasedAt
    } else return res.status(400).send({ status: false, message: "enter valid date format" })

    if (isValid(ISBN) && validISBN(ISBN)) {
      book.ISBN = ISBN
    } else return res.status(400).send({ status: false, message: "enter valid ISBN" })

    book.save()
    res.status(200).send({ status: true, message: "success", data: book })
  }
  catch (err) {
    return res.status(500).send({ status: false, message: err.message })
  }
}



//====================================== 7-DeletedBook By Path Param Id =========================================//


let deleteBooks = async function (req, res) {
  try {
    let id = req.params.bookId

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ status: false, message: "not a valid bookId" })
    }

    let validation = await booksModel.findOneAndUpdate({ _id: id, isDeleted: false }, { $set: { isDeleted: true, deletedAt: new Date() } }, { new: true })
    if (!validation) {
      return res.status(404).send({ status: false, message: "Book is already deleted or does not exist" })
    }
    return res.status(200).send({ status: true, message: "Successfully Deleted" })

  }
  catch (err) {
    return res.status(500).send({ status: false, msg: err.message });
  }
}


module.exports = { createBook, getBooks, deleteBooks, updateBooks, getById }