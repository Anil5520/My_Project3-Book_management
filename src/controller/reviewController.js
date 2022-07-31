const reviewModel = require("../model/reviewModel")
const booksModel = require('../model/booksModel')
const mongoose = require("mongoose");


//========================================= 8-Create Review Api ==================================================//


const createReview = async function (req, res) {
    try {

        let data = req.body;
        bookId = req.params.bookId;
        
        // Checks if valid bookId
        if (!mongoose.isValidObjectId(bookId)) {
            return res.status(400).send({ status: false, message: "write valid objectId" });
        }
        
        //check wheather given bookId is present in DB or not
        let checkBookId = await booksModel.findOne({ _id: bookId, isDeleted: false })
        if (!checkBookId) {
            return res.status(400).send({ status: false, message: "write valid bookId that are present in your collections or not deleted" });
        }

        //create review validations
        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, message: "Body cannot be empty" });
        }
              
        if (!data.rating) {
            return res.status(400).send({ status: false, message: "Write rating" });
        }
        if (typeof data.rating != "number") {
            return res.status(400).send({ status: false, message: "Write rating in a number" });
        }
        if ((data.rating < 1) || (data.rating > 5)) {
            return res.status(400).send({ status: false, message: "You can give rating more than 0  or less than 5 in number only" });
        }
        
        data.reviewedAt = Date.now()
        data.bookId=bookId
        //review creation
        let save = await reviewModel.create(data);

        let forLength = await reviewModel.find({ isDeleted: false, bookId: data.bookId })

        let find = await booksModel.findOneAndUpdate({ isDeleted: false, _id: data.bookId }, { $set: { reviews: forLength.length } }, { new: true })

        if (!find) {
            return res.status(404).send({ status: false, msg: "book id not exist" })
        }

        let object = {
            _id: find._id,
            title: find.title,
            excerpt: find.excerpt,
            userId: find.userId,
            category: find.category,
            subcategory: find.subcategory,
            isDeleted: find.isDeleted,
            reviews: forLength.length,
            releasedAt: find.releasedAt,
            createdAt: find.createdAt,
            updatedAt: find.updatedAt,
            reviewsData: {}
        }

        if (save) {
            object.reviewsData._id = save._id
            object.reviewsData.bookId = save.bookId
            object.reviewsData.reviewedBy = save.reviewedBy
            object.reviewsData.reviewedAt = save.reviewedAt
            object.reviewsData.rating = save.rating
            object.reviewsData.review = save.review
        }
        return res.status(201).send({ status: true, data: object })
    }
    catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}



//========================================= 9-Update Review Api ==================================================//


const updateReview = async function (req, res) {
    try {
        let bookId = req.params.bookId;
        let reviewId = req.params.reviewId
        if (!mongoose.isValidObjectId(bookId)) {
            return res.status(400).send({ status: false, message: "write valid book id" });
        }
        if (!mongoose.isValidObjectId(reviewId)) {
            return res.status(400).send({ status: false, message: "write valid review Id" });
        }

        body = req.body;
        const { review, reviewedBy, rating } = body
        let find = await booksModel.findOne({ isDeleted: false, _id: bookId })
        if (!find) {
            return res.status(404).send({ status: false, msg: "book id not exist" })
        }

        let update = await reviewModel.findOneAndUpdate({ _id: reviewId, bookId: bookId, isDeleted: false }, { $set: { reviewedBy, rating, review } }, { new: true }).select({ _id: 1, bookId: 1, review: 1, reviewedBy: 1, reviewedAt: 1, rating: 1 })
        if (!update) {
            return res.status(404).send({ status: false, msg: "reviewId not found" })
        }
        console.log(update)
        let object = {
            _id: find._id,
            title: find.title,
            excerpt: find.excerpt,
            userId: find.userId,
            category: find.category,
            isDeleted: find.isDeleted,
            reviews: find.reviews,
            releasedAt: find.releasedAt,
            createdAt: find.createdAt,
            updatedAt: find.updatedAt
        }
        object.reviewsData = update

        return res.status(200).send({ status: true, message: 'Books list', data: object })
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}



//========================================= 10-Delete Review Api =================================================//


let deleteReview = async function (req, res) {
    try {
        let bId = req.params.bookId
        let rId = req.params.reviewId

        if (!mongoose.isValidObjectId(bId)) {
            return res.status(400).send({ status: false, message: "write valid book id" });
        }
        if (!mongoose.isValidObjectId(rId)) {
            return res.status(400).send({ status: false, message: "write valid review Id" });
        }
        let book = await booksModel.findOne({ _id: bId, isDeleted: false })
        let previousReview = book.reviews
        console.log(book.reviews)
        if (!book) {
            return res.status(404).send({ status: false, message: "book is not present or deleted" })
        }

        let review = await reviewModel.findOne({ _id: rId, isDeleted: false })
        if (!review) {
            return res.status(404).send({ status: false, message: "review is not present or deleted" })
        }

        if (review.bookId != bId) {
            return res.status(400).send({ status: false, message: "enter correct reviewid for the book" })
        }

        review.isDeleted = true
        review.save()
        await booksModel.findOneAndUpdate({ _id: bId }, { $set: { reviews: previousReview - 1 } }, { new: true })

        res.status(200).send({ status: true, message: "review deleted successfully" })
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }

}


module.exports = { createReview, updateReview, deleteReview }