// const jwt = require("jsonwebtoken");
// const User = require("../models/userModel");
// const asyncHandler = require("express-async-handler");

// const authMiddleware = asyncHandler ( async (req, res, next) => {
//     let token;
//     if(req?.headers?.authorization?.startsWith("Bearer")){
//         let token = req?.headers?.authorization.split(" ")[1];
//         try {
//             if(token){
//                 const decoded = jwt.verify(token, process.env.JWT_SECRET);
//                 const user = await User.findById(decoded?.id); 
//                 if (!user) {
//                     res.status(401);
//                     throw new Error("User associated with token not found or deleted.");
//                 }
//                 req.user = user;
//                 next();
//             }else {
//                 res.status(401);
//                 throw new Error("Token missing from Authorization header.");
//             }
//         } catch (error) {
//             throw new Error("Not Authorized token expired, Please Login again");
//         }
//     }else{
//         res.status(401);
//         throw new Error("There is no token attched to header");
//     }
// });

// const isAdmin = asyncHandler ( async (req, res, next) => {
//     const {email} = req.user;
//     const adminUser = await User.findOne({ email });
//     if(adminUser.role !== "admin"){
//         throw new Error("You are not an admin");
//     }else{
//         next();
//     }
// });

// module.exports = { authMiddleware, isAdmin};




const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");

const authMiddleware = asyncHandler(async (req, res, next) => {
  let token;

  // ✅ Check Authorization Header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];

    try {
      if (!token) {
        return res.status(401).json({ message: "Token missing" });
      }

      // ✅ Verify Token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // ✅ Get User From DB
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res
          .status(401)
          .json({ message: "User not found for this token" });
      }

      // ✅ Attach User
      req.user = user;
      next();
    } catch (error) {
      return res
        .status(401)
        .json({ message: "Token expired or invalid. Please login again" });
    }
  } else {
    return res
      .status(401)
      .json({ message: "No Authorization header with Bearer token" });
  }
});


// ✅ ADMIN CHECK (100% SAFE)
// const isAdmin = asyncHandler(async (req, res, next) => {
//   if (!req.user || !req.user.email) {
//     return res.status(401).json({ message: "User not authenticated" });
//   }

//   const adminUser = await User.findOne({ email: req.user.email });

//   if (!adminUser || adminUser.role !== "admin") {
//     return res.status(403).json({ message: "You are not an admin" });
//   }

//   next();
// });

const isAdminOrSuperAdmin = asyncHandler(async (req, res, next) => {
  if (req.user.role === "admin" || req.user.role === "super_admin") {
    return next();
  }

  return res.status(403).json({ message: "Access denied" });
});




module.exports = { authMiddleware, isAdminOrSuperAdmin };
