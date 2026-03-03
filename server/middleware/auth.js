import User from "../models/userModel.js";
import jwt from 'jsonwebtoken'
export const protectRoute=async(req,res,next)=>{
    try{
        console.log("🔐 PROTECT ROUTE MIDDLEWARE HIT");
        console.log("Headers received:", req.headers);
        const token=req.headers.token;
        console.log("Token from headers:", token);
        if(!token){
            return res.json({success:false,message:"No token provided"})
        }
        const decoded=jwt.verify(token,process.env.JWT_SECRET)
        console.log("Decoded token:", decoded);
        const user=await User.findById(decoded.userid).select("-password")
        console.log("User found from DB:", user);
        if(!user){
            return res.json({success:false,message:"User not found"})
        }
        req.user=user;
        next();
    }
    catch(err){
        console.log("❌ AUTH MIDDLEWARE ERROR:", err.message);
        console.log("Full error:", err);
         res.json({success:false,message:err.message});
    }
}

export const checkAuth=(req,res)=>{
    res.json({success:true,user:req.user});
}