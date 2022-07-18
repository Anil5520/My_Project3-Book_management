const express = require('express');
const router = express.Router();
const { createUser, loginUser } = require('../controller/userController')
const { authenticate, authorise } = require("../middleware/auth")
const { createBook, getBooks, getById, updateBooks, deleteBooks } = require('../controller/bookController')
const { createReview, deleteReview, updateReview } = require('../controller/reviewController');



router.post('/register', createUser)
router.post('/login', loginUser)

router.post('/books', authenticate, createBook)
router.get('/books', authenticate, getBooks)
router.get('/books/:bookId', authenticate, getById)
router.put('/books/:bookId', authenticate, authorise, updateBooks)
router.delete('/books/:bookId', authenticate, authorise, deleteBooks)

router.post('/books/:bookId/review', createReview)
router.delete('/books/:bookId/review/:reviewId', deleteReview)
router.put('/books/:bookId/review/:reviewId', updateReview)



router.all('/**', function (req, res) {
    res.status(400).send({ status: false, messsage: "invalid http request" })
})

module.exports = router;