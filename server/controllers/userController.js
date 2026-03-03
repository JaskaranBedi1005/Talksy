
import { generateToken } from "../lib/utils.js"
import User from "../models/userModel.js"
import bcrypt from "bcryptjs"
import cloudinary from "../lib/cloudinary.js"

export const signup=async(req,res)=>{
    const {fullName,bio,email,password}=req.body
    try{
        if(! fullName || !email || !bio || !password){
            return res.json({success:false,message:"Missing details"})
        }
        const user=await User.findOne({email})
        if(user){
             return res.json({success:false,message:"Account already exists"})
        }
        const salt=await bcrypt.genSalt(10);
        const hashedPassword=await bcrypt.hash(password,salt);
        const newUser=await User.create({
            fullName,
            email,
            password:hashedPassword,
            bio,
        })
        const token=generateToken(newUser._id);
        res.json({success:true,userData:newUser,token,message:"Account created successfully"})
    }
    catch(err){
        console.log(err.message);
        res.json({success:false,message:err.message})
    }
}
// Controller to check user is authenticated or not
export const login=async(req,res)=>{
    try{
        const {email,password}=req.body;
        const userData=await User.findOne({email});
        if(!userData){
            return res.json({success:false,message:"User not found"})
        }
        const isPasswordCorrect=await bcrypt.compare(password,userData.password)
        if(!isPasswordCorrect){
            return res.json({success:false,message:"Invalid credentials"})
        }
        const token=generateToken(userData._id);
        res.json({success:true,userData,token,message:"Logged in successfully"})
    }
    
    catch(error){
         console.log(error.message);
        res.json({success:false,message:error.message})
    }
}

//Controller for user to update profile details
export const updateProfile=async(req,res)=>{
    try{
        console.log("BACKEND UPDATE PROFILE HIT");
        console.log("Received body:", req.body);
        console.log("User from middleware:", req.user);
        const {profilePic,bio,fullName}=req.body
        const userId=req.user._id
        console.log("UserId:", userId);
        let updatedUser;
        if(!profilePic){
            console.log("No profile pic, updating only bio and fullName");
            updatedUser=await User.findByIdAndUpdate(userId,{bio,fullName},{new:true})
        }
        else{
            console.log("Uploading profile pic to cloudinary...");
            const upload=await cloudinary.uploader.upload(profilePic, {
                resource_type: "auto"
            });
            console.log("Cloudinary response:", upload.secure_url);
            updatedUser=await User.findByIdAndUpdate(userId,{profilePic:upload.secure_url,bio,fullName},{new:true})
            console.log("Updated user in DB:", updatedUser);
        }
        res.json({success:true,user:updatedUser})
    }
    catch(err){
        console.log("ERROR in updateProfile:", err.message);
        console.log("Full error:", err);
        res.status(500).json({success:false,message:err.message});
    }
}