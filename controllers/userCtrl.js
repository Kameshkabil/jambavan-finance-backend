const { generateToken } = require("../config/jwtToken");
const User = require("../models/userModel");
// const Access = require("../models/accessModel");
const asyncHandler = require("express-async-handler");
const validateMongodbId = require("../utils/validateMongodbId");
const { generateRefreshToken } = require("../config/refreshToken");
const { sendEmail } = require("../controllers/emailCtrl");
const crypto = require("crypto");

const createUser = asyncHandler (async (req, res) => {    
    const email = req.body.email;
    const findUser = await User.findOne({ email });
    if (!findUser) {
        const createUser = await User.create(req.body);
        res.status(201).json(createUser);
    }else{
        throw new Error("User Already Exists");
    }
});

const loginUser = asyncHandler (async (req, res) => {
    const { email, password } = req.body;
    const findUser = await User.findOne({ email });
    if(findUser && (await findUser.isPasswordMatched(password))){
        const refreshToken = await generateRefreshToken(findUser?._id);
        const updateUser = await User.findByIdAndUpdate(
            findUser?._id,
            {
                refreshToken: refreshToken,
            },
            {
                new: true,
            },
        );
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 74 * 60 * 60 * 1000, 
        });
        res.json({
            _id: findUser?._id,
            firstname: findUser?.firstname,
            lastname: findUser?.lastname,
            email: findUser?.email,
            mobile: findUser?.mobile,
            token: generateToken(findUser?._id),
        })
    }else{
        throw new Error("Invalid Credentials");
    }
});

//handle refresh token
// const handleRefreshToken = asyncHandler ( async (req, res) => {
//     const cookie = req.cookies;
//     console.log(cookie);
// });

const getallUser = asyncHandler ( async (req, res) => {
    try {
        const getUsers = await User.find();
        res.status(200).json(getUsers);
    } catch (error) {
        throw new Error(error);
    }
});

const getUser = asyncHandler ( async (req, res) => {
    const { id } = req.params;
    try {
        const getUser = await User.findById(id);
        res.status(200).json(getUser);
    } catch (error) {
        throw new Error(error);
    }
});

const updateUser = asyncHandler( async (req, res) => {
    const {_id} = req.user;
    try {
        const updateUser = await User.findByIdAndUpdate(
            _id,
            {
                firstname: req?.body?.firstname,
                lastname: req?.body?.lastname,
                email: req?.body?.email,
                mobile: req?.body?.mobile,
            },
            {
                new: true,
            },
        );
        res.status(200).json(updateUser);
    } catch (error) {
        throw Error(error);
    }
});

const deleteUser = asyncHandler( async (req, res) => {
    const { id } = req.params;
    try {
        const deleteUser = await User.findByIdAndDelete(id);
        res.status(200).json(deleteUser);
    } catch (error) {
        throw new Error(error);
    }
});

const blockUser = asyncHandler( async (req, res) => {
    const { id } = req.params;
    validateMongodbId(id);
    try {
        const blockUser = await User.findByIdAndUpdate(
            id,
            {
                isBlocked: true,
            },
            {
                new: true,
            },
        );
        res.status(200).json(
            {
                message: "User Blocked"
            }
        );
    } catch (error) {
        throw new Error(error);
    }
});

const unblockUser = asyncHandler( async (req, res) => {
    const { id } = req.params;
    validateMongodbId(id);
    try {
        const blockUser = await User.findByIdAndUpdate(
            id,
            {
                isBlocked: false,
            },
            {
                new: true,
            },
        );
        res.status(200).json(
            {
                message: "User UnBlocked"
            }
        );
    } catch (error) {
        throw new Error(error);
    }
});

const updatePassword = asyncHandler( async (req, res) => {
    const { _id } = req.user;
    const { password } = req.body;
    validateMongodbId(_id);
    const user = await User.findById(_id);
    if(password){
        user.password = password;
        const updatedPassword = await user.save();
        res.json(updatedPassword);
    }else{
        res.json(user);
    }
});

const forgotPasswordToken = asyncHandler (async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if(!user) throw new Error("User not found with this email");
    try{
        const token = await user.createPasswordResetToken();
        await user.save();
        const resetURL = `Hi, Please follow this link to reset your password. This link is valid till 30 minutes from now. <a href='http://localhost:5500/reset-password.html?token=${token}'>Click Here</a>`;
        const data = {
            to: email,
            subject: "Forgot Password Link",
            text: "Hey User",
            htm: resetURL,
        }
        sendEmail(data);
        res.json(token);
    }catch(error){
        throw new Error(error);
    }
});

const resetPassword = asyncHandler( async (req, res) => {
    const { password } = req.body;
    const { token } = req.params;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
    });
    if(!user) throw new Error("Token Expired. Please try again later");
    user.password = password;
    user.passwordResetToken =  undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    res.json(user);
});

// const checkAccessId = asyncHandler( async (req, res) => {
//     const { accessId } = req.body;
//     try{
//         const exists = await Access.findOne({ accessId });
//         if (exists) {
//             return res.json({ valid: true });
//         } else {
//             return res.json({ valid: false });
//         }
//     }catch(error){
//         throw new Error(error);
//     }
// })

module.exports = { 
    createUser,
    loginUser, 
    getallUser, 
    getUser, 
    deleteUser, 
    updateUser, 
    blockUser, 
    unblockUser,
    //handleRefreshToken,
    updatePassword,
    forgotPasswordToken,
    resetPassword,
    // checkAccessId
};