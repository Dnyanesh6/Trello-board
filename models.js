import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

const organizationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }]
});

const boardsSchema = new mongoose.Schema({
    name: { type: String, required: true },
    orgId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
    }
});

const issueSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: {
        type: String,
        enum: ['To Do', 'In Progress', 'Done'],
        default: 'To Do',
    },
    boardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Board',
    }
});

const User = mongoose.model("User", userSchema);
const Organization = mongoose.model("Organization", organizationSchema);
const Board = mongoose.model("Board", boardsSchema);
const Issue = mongoose.model("Issue", issueSchema);

export { User, Organization, Board, Issue };