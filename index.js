// const USERS = [];
// const ORGANIZATIONS = [];
// const BOARDS = [];
// const ISSUES = [];
// const STATUS = ["To Do", "In Progress", "Done"];
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import dotenv from 'dotenv';
import { User, Organization, Board, Issue } from './models.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { authMiddleware } from './middleware.js';

dotenv.config();

const connection = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            dbName: process.env.DB_NAME,
        });
        console.log("Connected to MongoDB");
    } catch (err) {
        console.error("Failed to connect to MongoDB", err);
    }
};

connection();

const app = express()
app.listen(3000,()=>{
    console.log('server is running on port 3000');
    console.log('http://localhost:3000');
})
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')));

app.post("/health",authMiddleware, (req,res)=>{
    
    res.status(200).json({
        message: "Server is healthy"
    })
})

//CREATE
app.post('/signup', async (req, res) => {
    const {username, password} = req.body;

    if(!username || !password) {
        res.status(400).json({
            message:"Incomplete data"
        })
    return;
    }

    const userExist = await User.findOne({
        username: username
    })
    if (userExist) {
        res.status(401).json({
            message:"User already exists with same username"
        })
    }

    const newUser =await User.create({
        username: username,
        password: password
    })

    console.log(newUser);

    res.status(201).json({
        message:"User Created Successfully",
        userId: newUser._id,
        username: newUser.username
    })
})   

app.post('/signin', async (req, res) => {
    const {username, password} = req.body;

    if(!username ||! password){
        res.status(401).json({
            mesage:"Incomplete data"
        })
        return;
    }

    const user = await User.findOne({
        username: username,
        password: password
    })
    const userId = user._id;
    if(!user){
        res.status(404).json({
            message:"User not found"
        })
    return;
    }

    const token = jwt.sign({username: user.username, userId: userId}, 
        process.env.JWT_SECRET,
        {expiresIn: '1h'}
    )

    res.status(200).json({
        message:"User signed in successfully",
        user:{
            id: user._id,
            username: user.username,
            token: token
        }
    })
})


//AUTHENTICATED-MIDDLEWARE
//onboarding route
app.post('/create-org', authMiddleware, async (req, res) => {
    const userId = req.userId;

    const {orgName, description} = req.body;
    if(!orgName || !description){
        res.status(401).json({
            message:"Incomplete data"
        })
    return;
    }

    const orgExist = await Organization.findOne({
        name: orgName
    })

    if(orgExist){
        res.status(401).json({
            message:"Organization already exists"
        })
        return;
    }

    const newOrg = await Organization.create({
        name: orgName,
        description: description,
        admin: userId,
        members: []
    }); 

    console.log("newOrg", newOrg);
    res.status(200).json({
        message:"Organization created successfully",
        org:{
            id: newOrg._id,
        }
    })
});

//creating a board route
app.post('/boards', authMiddleware, async (req, res) => {
    const userId = req.userId;
    const orgId = req.body.orgId;

    const {boardName} = req.body;
    if(!boardName || !orgId){
        res.status(401).json({
            message:"Incomplete data"
        })
    return;
    }

    const org = await Organization.findOne({
        _id: orgId
    });

    if(!org){
        res.status(404).json({
            message:"Organization not found"
        })
    return;
    }

    if (!org.admin.equals(userId)) {
        res.status(403).json({
            message:"Only the organization admin can create boards"
        })
        return;
    }

    const newBoard = await Board.create({
        name: boardName,
        orgId: orgId
    })

    console.log(newBoard);

    res.status(200).json({
        message:"Board created successfully",
        board:{
            id: newBoard._id,
            name: newBoard.name,
            orgId: newBoard.orgId
        }
    })
})

//adds an issue to the board
app.post('/issues', authMiddleware, async (req, res) => {
    const userId = req.userId;

    const boardId = req.body.boardId;

    const {title, description} = req.body;
    if(!title || !description || !boardId){
        res.status(401).json({
            message:"Incomplete data"
        })
    return;
    }

    const board =await Board.findOne({
        _id: boardId
    })

    if(!board){
        res.status(404).json({
            message:"Board not found"
        })
    return;
    }
    
    const org = await Organization.findOne({
        _id: board.orgId
    })


    if(!org.admin.equals(userId) && !org.members.includes(userId)){
        res.status(403).json({
            message:"Only the organization admin can create issues"
        })
        return;
    }

    const newIssue = await Issue.create({
        title: title,
        description: description,
        boardId: boardId,
    })

    console.log(newIssue);

    res.status(200).json({
        message:"Issue created successfully",
        issue:{
            id: newIssue._id,
            title: newIssue.title,
            description: newIssue.description,
            boardId: newIssue.boardId,
            status: newIssue.status
        }
    })
})

//adding memeber to the organization
app.post('/addUserToOrganization',authMiddleware, async (req, res) => {
    const userId = req.userId;

    const username = req.body.username;
    const orgId = req.body.orgId;

    if(!username || !orgId){
        res.status(401).json({
            message:"Incomplete data"
        })
    return;
    }

    const org = await Organization.findOne({
        _id: orgId
    })

    if(!org){
        res.status(404).json({
            message:"Organization not found"
        })
    return;
    }

    if (!org.admin.equals(userId)) {
        res.status(403).json({
            message:"Only the organization admin can add members to the organization"
        })
        return;
    }

    const user = await User.findOne({
        username: username
    });
    if(!user){
        res.status(404).json({
            message:"User not found or User does not exist"
        })
    return;
    }

    if (org.members.includes(user._id)) {
        res.status(400).json({
            message:"User is already a member of the organization"
        })
        return;
    }

    const updatedOrg = await Organization.findByIdAndUpdate(
        orgId,
        {$push: {members: user._id}},
        {new: true}
    )

    console.log(updatedOrg);

    res.status(200).json({
        message:"User added to the organization successfully",
        organization:{
            id: updatedOrg._id,
            name: updatedOrg.name,
            description: updatedOrg.description,
            admin: updatedOrg.admin,
            members: updatedOrg.members
        }
    })
})

//READ
app.get('/organizations',authMiddleware,async (req, res) => {
    const userId = req.userId;

    const userOrgs = await Organization.find({
        $or: [
            {admin: userId},
            {members: userId}
        ]
    })

    res.status(200).json({
        organizations: userOrgs
    });
});

app.get('/boards',authMiddleware, (req, res) => { //to be checked : saying only org members can access the boards but not using auth middleware
    const userId = req.userId;
    const orgId = req.body.orgId;

    if(!orgId){
        res.status(401).json({
            message:"Incomplete data"
        })
    return;
    }

    const org = ORGANIZATIONS.find(org => org.id === orgId);
    if(!org){
        res.status(404).json({
            message:"Organization not found"
        })
    return;
    }

    if(userId !== org.admin && !org.members.includes(userId)){
        res.status(403).json({
            message:"Only organization members can access this resource"
        })
    return;
    }

    const userBoards = BOARDS.filter(board => board.orgId === orgId);

    res.status(200).json({
        message:"Boards retrieved successfully",
        boards: userBoards
    })
})

app.get('/issues',authMiddleware, (req,res)=>{
    const userId = req.userId;
    const boardId = req.body.boardId;

    if(!boardId){
        res.status(401).json({
            message:"Incomplete data"
        })
    return;
    }

    const board = BOARDS.find(board => board.id === boardId);
    if(!board){
        res.status(404).json({
            message:"Board not found"
        })
    return;
    }

    const org = ORGANIZATIONS.find(org => org.id === board.orgId);
    if(userId !== org.admin && !org.members.includes(userId)){
        res.status(403).json({
            message:"Only organization members can access this resource"
        })
    return;
    }

    const boardIssues = ISSUES.filter(issue => issue.boardId === boardId);

    res.status(200).json({
        message:"Issues retrieved successfully",
        issues: boardIssues
    })
})

//list the memebers of the organizations
app.get('/members', authMiddleware, (req,res)=>{
    const userId = req.userId;

    const orgId = req.body.orgId;

    if(!orgId){
        res.status(401).json({
            message:"Incomplete data"
        })
    return;
    }

    const org = ORGANIZATIONS.find(org => org.id === orgId);

    if(!org){
        res.status(404).json({
            message:"Organization not found"
        })
    return;
    }

    if(userId !== org.admin && !org.members.includes(userId)){
        res.status(403).json({
            message:"Only organization members can access this resource"
        })
    return;
    }

    const members = USERS.filter(user => org.members.includes(user.id)).map(user => ({
        id: user.id,
        username: user.username
    }))

    res.status(200).json({
        message:"Members retrieved successfully",
        members: members
    })
});

//UPDATE
app.put('/issues-update',authMiddleware, (req, res) => {
    const userId = req.userId;

    const issueId = req.body.issueId;
    
    const issue = ISSUES.find(issue => issue.id === issueId);
    if(!issue){
        res.status(404).json({
            message:"Issue not found"
        })
    return;
    }
    
    const board = BOARDS.find(board => board.id === issue.boardId);
    const org = ORGANIZATIONS.find(org => org.id === board.orgId);
    if(userId !== org.admin && !org.members.includes(userId)){
        res.status(403).json({
            message:"Only organization members can access this resource"
        })
    return;
    }

    if(issue.status === STATUS[0]){
        issue.status = STATUS[1];
    }else if(issue.status === STATUS[1]){
        issue.status = STATUS[2];
    }

    res.status(200).json({
        message:"Issue status updated successfully",
        issue: issue
    })
});

//DELETE 
app.delete('/issues',authMiddleware, (req, res) => {
    const userId = req.userId;
    const issueId = req.body.issueId;

    if(!issueId){
        res.status(401).json({
            message:"Incomplete data"
        })
    return;
    }

    const issueIndex = ISSUES.findIndex(issue => issue.id === issueId);
    if(issueIndex === -1){
        res.status(404).json({
            message:"Issue not found"
        })
    return;
    }

    const board = BOARDS.find(board => board.id === ISSUES[issueIndex].boardId);
    const org = ORGANIZATIONS.find(org => org.id === board.orgId);

    if(userId !== org.admin &&  !org.members.includes(userId)){
        res.status(403).json({
            message:"Only organization members can access this resource"
        })
    return;
    }

    ISSUES.splice(issueIndex, 1);

    res.status(200).json({
        message:"Issue deleted successfully"
    })
});

//delete or removes the member from the organization
app.delete('/delete-member', authMiddleware, (req, res) => {
    const userId = req.userId;
    const username = req.body.username;
    const orgId = req.body.orgId;

    if(!username || !orgId){
        res.status(401).json({
            message:"Incomplete data"
        })
    return;
    }

    const org = ORGANIZATIONS.find(org => org.id === orgId);
    if(!org){
        res.status(404).json({
            message:"Organization not found"
        })
    return;
    }

    if(userId !== org.admin && !org.members.includes(userId)){
        res.status(403).json({
            message:"Only organization members can access this resource"
        })
    return;
    }

    const memberIndex = org.members.findIndex(memberId => memberId === userId);
    if(memberIndex === -1){
        res.status(404).json({
            message:"Member not found"
        })
    return;
    }

    org.members.splice(memberIndex, 1);

    res.status(200).json({
        message:"Member removed successfully"
    })

})

app.get('/', ( res) => {
    res.sendFile(__dirname + '/public/index.html');
});
