const postModel = require('../models/postModel')
const userModel = require('../models/userModel')
const HttpError = require('../models/errorModel')

const path = require('path')
const fs = require('fs')
const { v4: uuid } = require('uuid')

//api/posts
const createPost = async (req, res, next) => {
    try {
        const { title, description, category } = req.body;

        if (!title || !description || !category || !req.files) {
            return next(new HttpError("Fill in all the fields and choose a thumbnail.", 422))
        }

        const { thumbnail } = req.files;
        if (thumbnail.size > 2000000) {
            return next(new HttpError("Thumbnail too big. File should be less than 2MB."))
        }

        let fileName = thumbnail.name;
        let splittedFileName = fileName.split('.');
        let newFileName = splittedFileName[0] + uuid() + '.' + splittedFileName[splittedFileName.length - 1];

        thumbnail.mv(path.join(__dirname, '..', 'uploads', newFileName), async (err) => {
            if (err) {
                return next(new HttpError(err))
            }

            const newPost = await postModel.create({ title, description, category, thumbnail: newFileName, creator: req.user.id })

            if (!newPost) {
                return next(new HttpError("Post couldn't be created.", 422));
            }

            //we need to update the user posts count 
            const user = await userModel.findById(req.user.id);
            const userPostCount = user.posts + 1;
            await userModel.findByIdAndUpdate(req.user.id, { posts: userPostCount })

            res.status(201).json(newPost)
        })
    }
    catch (err) {
        return next(new HttpError(err))
    }
}

//api/posts
const getPosts = async (req, res, next) => {
    try {
        const posts = await postModel.find().sort({ updatedAt: -1 })
        res.status(200).json(posts);
    }
    catch (err) {
        return next(new HttpError(err))
    }
}


//api/posts/:id
const getPost = async (req, res, next) => {
    try {
        const postId = req.params.id;
        const post = await postModel.findOne({ _id: postId });

        if (!post) {
            return next(new HttpError("Post not found.", 404))
        }
        res.status(200).json(post);
    }
    catch (err) {
        return next(new HttpError(err))
    }
}


//api/posts/categories/:id
const getCategoryPosts = async (req, res, next) => {
    try {
        const { categoryId } = req.params;
        const posts = await postModel.find({ category: categoryId }).sort({ createdAt: -1 })
        res.status(200).json(posts)
    }
    catch (err) {
        return next(new HttpError(err))
    }
}


//api/posts/users/:id
const getUserPosts = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userPosts = await postModel.find({ creator: id }).sort({ createdAt: -1 });

        res.status(200).json(userPosts);


    } catch (error) {
        return next(new HttpError(error))
    }
}

//api/posts/:id
const editPost = async (req, res, next) => {
    try {
        let updatedPost;

        //post to edit
        const postId = req.params.id;

        let { title, category, description } = req.body;
        if (!title || !category || description.length < 12) {
            return next(new HttpError("Fields cannot be empty.", 422))
        }

        //get old post from database
        const oldPost = await postModel.findById(postId);

        //making sure that the logged in user and the creator of the post is same user.
        console.log(req.user.id);
        console.log(oldPost.creator);
        if (req.user.id != oldPost.creator) {
            return next(new HttpError("Post couldn't edited.", 403))
        }


        // if thumbnail is not supposed to be changed, means if there's nothing in req.files
        if (!req.files) {
            updatedPost = await postModel.findByIdAndUpdate(postId, { title, category, description }, { new: true })
        }

        //if there is thumbnail to change
        else {
            //delete the old post from uploads folder
            fs.unlink(path.join(__dirname, '..', 'uploads', oldPost.thumbnail), async (err) => {
                if (err) {
                    return next(new HttpError(err));
                }
            })

            //if no error, upload the new thumbnail
            const { thumbnail } = req.files;

            if (thumbnail.size > 2000000) {
                return next(new HttpError("Thumbnail too big. File should be less than 2MB."))
            }



            let fileName = thumbnail.name;
            let splittedFileName = fileName.split('.');
            let newFileName = splittedFileName[0] + uuid() + '.' + splittedFileName[splittedFileName.length - 1];



            //this is a async method, moving file is an async operation
            thumbnail.mv(path.join(__dirname, '..', 'uploads', newFileName), async (err) => {
                if (err) {
                    return next(new HttpError(err))
                }

            })

            updatedPost = await postModel.findByIdAndUpdate(postId, { title, description, category, thumbnail: newFileName }, { new: true });

        }

        if (!updatedPost) {
            return next(new HttpError("Post couldn't be updated.", 400))
        }
        res.status(200).json(updatedPost);
    }

    catch (err) {
        return next(new HttpError(err));
    }
}

//api/posts/:id
const deletePost = async (req, res, next) => {
    try {
        const postId = req.params.id;
        if (!postId) {
            return next(new HttpError("Post Unavailable.", 400))
        }

        //get the post first, we need to delete the thumnail from the uploads folder
        const post = await postModel.findOne({ _id: postId });
        const fileName = post?.thumbnail;

        //but, a user should not be able to delete someone else's post
        if (req.user.id != post.creator) {
            return next(new HttpError("Post couldn't be deleted.", 403))
        }

        //delete the thumbnail from uploads folder
        fs.unlink(path.join(__dirname, '..', 'uploads', fileName), async (err) => {
            if (err) {
                return next(new HttpError(err));
            }
        })

        const deletedPost = await postModel.findByIdAndDelete(postId);

        //reducing post count of that user
        const user = await userModel.findOne({ _id: post.creator });
        const newPostCount = user?.posts - 1;
        await userModel.findByIdAndUpdate(post.creator, { posts: newPostCount })

        // res.status(200).json(deletedPost);
        res.json(`Post ${postId} deleted Successfully.`)
    }
    catch (err) {
        return next(new HttpError(err));
    }
}



module.exports = {
    createPost, deletePost, editPost, getPosts, getPost, getCategoryPosts, getUserPosts
}