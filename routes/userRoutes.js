const express = require('express')
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware')

const {
    registerUser, loginUser, getUser, getAuthors, changeAvatar, editUser
} = require('../controllers/userControllers')


router.post('/register', registerUser)
router.post('/login', loginUser)
router.get('/:id', getUser)
router.get('/', getAuthors)
router.post('/change-avatar', authMiddleware, changeAvatar)
router.patch('/edit-user', authMiddleware, editUser)


router.get('/', (req, res) => {
    res.send(500).json({ message: "Success" })
})

module.exports = router;