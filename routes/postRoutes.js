const express = require('express')
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware')

const { createPost, deletePost, editPost, getPosts, getPost, getCategoryPosts, getUserPosts } = require('../controllers/postControllers')


router.post('/', authMiddleware, createPost);
router.get('/', getPosts);
router.get('/:id', getPost);
router.patch('/:id', authMiddleware, editPost);
router.delete('/:id', authMiddleware, deletePost);
router.get('/categories/:categoryId', getCategoryPosts);
router.get('/users/:id', getUserPosts);

module.exports = router;