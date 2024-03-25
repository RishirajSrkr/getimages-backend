const jwt = require('jsonwebtoken')
const HttpError = require('../models/errorModel')

const authMiddleware = async (req, res, next) => {
    const authorization = req.headers.authorization || req.headers.Authorization;

    //"authorization -> Bearer fjdilfhj3oadfm1mlcd"
    if (authorization && authorization.startsWith("Bearer")) {
        const token = authorization.split(' ')[1];
        //token -> "fjdilfhj3oadfm1mlcd"

        jwt.verify(token, process.env.JWT_SECRET, (err, info) => {
            if (err) {
                return next(new HttpError("Unauthorized. Invalid token.", 403))
            }
            req.user = info;
            next();
        })
    }

    else {
        return next(new HttpError("Unauthorized. No token", 402))
    }
}

module.exports = authMiddleware;