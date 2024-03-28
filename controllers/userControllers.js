const HttpError = require('../models/errorModel')
const userModel = require('../models/userModel')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const fs = require('fs')
const path = require('path')
const { v4: uuid } = require('uuid')

//  api/users/register
const registerUser = async (req, res, next) => {
    try {
        const { name, email, password, confirmPassword } = req.body;

        if (!name || !email || !password || !confirmPassword) {
            return next(new HttpError("Fill in all the fields", 422))
        }

        const newEmail = email.toLowerCase();

        const emailExists = await userModel.findOne({ email: newEmail })

        //if email alredy exists
        if (emailExists) {
            return next(new HttpError("Email already exists", 422))
        }

        //checking if enetered password length is correct and matches with confirm password
        if ((password.trim()).length < 6) {
            return next(new HttpError("Password should be atleast 6 characters.", 422))
        }
        if (password !== confirmPassword) {
            return (new HttpError("Password do not match", 422))
        }

        //hashing password
        const saltRounds = 10;
        const salt = await bcrypt.genSalt(saltRounds);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await userModel.create({
            name, email: newEmail, password: hashedPassword
        })

        res.status(201).json(`New user ${newUser.email} registered.`);

    }
    catch (err) {
        return next(new HttpError("User Registration failed.", 422))
    }
}

//  api/users/login
const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return next(new HttpError("Fill in all the fields", 422))
        }

        const newEmail = email.toLowerCase();

        const user = await userModel.findOne({ email: newEmail });

        if (!user) {
            return next(new HttpError("Invalid Credentials. Email doesn't exist.", 422))
        }
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return next(new HttpError("invalid Credentials.", 422))
        }



        //JWT
        const { _id: id, name } = user;
        const jwtToken = jwt.sign({ id, name }, process.env.JWT_SECRET, { expiresIn: "1d" })

        res.status(200).json({ jwtToken, id, name })


        //alternative way---

        // const userObject = {
        //     name: user.name,
        //     email,
        //     id: user._id
        // }
        // const token = jwt.sign(userObject, process.env.JWT_SECRET, { expiresIn: "2h" })
        // userObject.jwtToken = token;

        // res.status(200).json({ userObject })

    }
    catch (err) {
        return next(HttpError("Login failed. Please check your credentials.", 422))
    }
}

//  api/users/:id
//it gives user detail
const getUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await userModel.findById(id).select('-password')
        if (!user) {
            return next(new HttpError("User not found.", 404))
        }
        res.status(200).json(user);
    }
    catch (err) {
        return next(new HttpError(err))
    }
}


//  api/users/change-avatar
const changeAvatar = async (req, res, next) => {
    try {
        if (!req.files.avatar) {
            return next(new HttpError("Please select an image.", 422))
        }

        //find user from database
        const user = await userModel.findById(req.user.id);

        //delete old avatar if exists
        if (user.avatar) {
            fs.unlink(path.join(__dirname, '..', 'uploads', user.avatar), (err) => {
                if (err) {
                    return next(new HttpError(err))
                }
            })
        }

        const { avatar } = req.files;
        //check file size
        if (avatar.size > 500000) {
            return next(new HttpError("Profile picture too big. Should be less than 500kb", 422))
        }

        //altering file name
        //avatar.2.jpg -> avatar+randomUUID+jpg
        let fileName;
        fileName = avatar.name;
        let splittedFileName = fileName.split('.');
        let newFileName = splittedFileName[0] + uuid() + '.' + splittedFileName[splittedFileName.length - 1]

        avatar.mv(path.join(__dirname, '..', 'uploads', newFileName), async (err) => {
            if (err) {
                return next(new HttpError(err))
            }

            const updatedAvatar = await userModel.findByIdAndUpdate(req.user.id, { avatar: newFileName }, { new: true });

            if (!updatedAvatar) {
                return next(new HttpError("Avatar couldn't be changed.", 422))
            }

            res.status(200).json(updatedAvatar)
        })
    }
    catch (error) {
        return next(new HttpError(error))
    }
}

//  api/users/edit-user
const editUser = async (req, res, next) => {

    try {
        const { name, email, currentPassword, newPassword, confirmNewPassword } = req.body;

        if (!name || !email || !currentPassword || !newPassword || !confirmNewPassword) {
            return next(new HttpError("Fill in all the fields", 422))
        }
if(currentPassword == newPassword){
    return next(new HttpError("New password cannot be same as current password.", 422))
}
        //get the user
        const user = await userModel.findById(req.user.id);
        if (!user) { return next(new HttpError("User not found.", 403)) }

        //make sure the new email doesn't already exists
        const emailExist = await userModel.findOne({ email: email }) //this gives a user who has the new email ID.
        //making sure the
        if (emailExist && (req.user.id != emailExist._id)) {
            return next(new HttpError("Email already exists.", 422))
        }


        //checking currentPasswrod with user password in database
        const validatePassword = await bcrypt.compare(currentPassword, user.password);

        if (!validatePassword) {
            return next(new HttpError("Invalid current password.", 422))
        }

        //compare new passwords
        if (newPassword !== confirmNewPassword) {
            return next(new HttpError("New passwords do not match.", 422))
        }

        //if everything is correct, hash the new password and update the db
        const saltRounds = 10;
        const salt = await bcrypt.genSalt(saltRounds);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        //update user info in db
        const newInfo = await userModel.findByIdAndUpdate(req.user.id, { name, email, password: hashedPassword }, { new: true })

        res.status(200).json(newInfo)

    }
    catch (err) {
        return next(new HttpError(err))
    }
}

//  api/users
// list out all the users
const getAuthors = async (req, res, next) => {
    try {
        const authors = await userModel.find().select('-password')
        res.json(authors)
    }
    catch (err) {
        return next(new HttpError(err))
    }
}

module.exports = {
    registerUser, loginUser, getUser, getAuthors, changeAvatar, editUser,myname
}