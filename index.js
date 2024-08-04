const express=require("express");
const cors=require("cors");
const mongoose=require("mongoose");
const jwt=require("jsonwebtoken");
const bcrypt=require("bcrypt");
const app=express();
app.use(express.json());
app.use(cors());
require("dotenv").config();

mongoose.connect("mongodb+srv://bharath21903:mech4004@cluster0.nakzwbc.mongodb.net/todolistapp");

const PORT=process.env.PORT || 4000;



//user schema

const Schema=mongoose.Schema;
const UserSchema=new Schema({
    email:{
        type:String,
        required:true,
        
    },
    password:{
        type:String,
        
    }
});

const todosSchema=new Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true},   
    
    task:{
        type:String,
        required:true
    },
    completed:{
        type:Boolean,
        default:false
    }
})

const User=mongoose.model("User",UserSchema);
const Todo=mongoose.model("Todo",todosSchema);


app.post("/register",async(req,res)=>{
    const {email,password}=req.body;
    const userPresent=await User.findOne({email:email});
    if(userPresent){
        res.status(400).json({message:"User already exist"});
    }
    const hasedPassword= await bcrypt.hash(password,10);
    const user=new User({email:email,password:hasedPassword});
    await user.save();
    res.status(201).send("User registeration successfully")
    
})

app.post("/login",async(req,res)=>{
    const {email,password}=req.body;
    const user=await User.findOne({email:email});
    if(user){
        const isPasswordMatch=await bcrypt.compare(password,user.password);
       if(isPasswordMatch){
            const token=jwt.sign({data:user.email},"secret_token",{expiresIn:"1hr"});
            res.status(200).json({token});
       }else{
        res.status(401).json({message:"wrong password"});
       }
    }else{
        res.status(401).json({message:"wrong mail id"});
    }
})

// authentication token

const authenticationToken=(req,res,next)=>{
    const authHeader=req.headers['Authorization'];
    if (authHeader){
        const token=authHeader.split(" ")[1]
        if(token){
            jwt.verify(token,"secret_token",(err,user)=>{
                if(err){
                    res.send("token not valid");
                }
                req.user=user;
                next();
            });
        }else{
            res.send("token is not defined");
        }
    };
}

// get userdetails
app.get("/users",authenticationToken,async(req,res)=>{
    const users=await User.find({})
    res.send(users)
})

// get all todos
app.get("/allTodos",authenticationToken,async(req,res)=>{
    const todos=await Todo.find({});
    res.send(todos);
});

// post the new todo
app.post("/addTodo",async(req,res)=>{
    const {userId,task}=req.body;
    const newTodo=new Todo({userId,task});
    await newTodo.save();
    res.status(201).send("new todo added successfully")
})

// update the todo
app.put("/todos/:id",async(req,res)=>{
    try
    {
    const {id}=req.params;
    const updatedTask=req.body;
    const updation=await Todo.findByIdAndUpdate(id,updatedTask,{new:true});
    if(!updation){
        res.send("todo not found")
    }
    res.send(updation);
} catch (error){
    res.send(error.message)
}
});

// delete the todo 
app.delete("/todos/:id",async(req,res)=>{
    try
    {
    const {id}=req.params;
    const deletedItem=await Todo.findByIdAndDelete(id);
    if(!deletedItem){
        res.send("todo not found")
    }
    res.send(updation);
} catch (error){
    res.send(error.message)
}
})

app.get("/",(req,res)=>{
    res.send("App is running")
})

app.listen(PORT,()=>{console.log(`Server is running on ${PORT}`)})