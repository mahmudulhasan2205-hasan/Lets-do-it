import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/Apiresponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!mongoose.isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID");

    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 100);

    const video = await Video.findOne({ _id: videoId, isPublished: true }).select("_id");
    if (!video) throw new ApiError(404, "Video not found");

    const [comments, totalComments] = await Promise.all([
        Comment.find({ video: videoId })
            .populate("owner", "fullName username avatar")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit),
        Comment.countDocuments({ video: videoId })
    ]);

    return res.status(200).json(new ApiResponse(200, {
        comments,
        page,
        limit,
        totalComments,
        totalPages: Math.ceil(totalComments / limit)
    }, "Comments fetched successfully"));
});

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { content } = req.body;
    if (!mongoose.isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID");
    if (!content?.trim()) throw new ApiError(400, "Comment content is required");

    const video = await Video.findOne({ _id: videoId, isPublished: true }).select("_id");
    if (!video) throw new ApiError(404, "Video not found");

    const comment = await Comment.create({
        content: content.trim(),
        video: videoId,
        owner: req.user._id
    });

    const result = await Comment.findById(comment._id).populate("owner", "fullName username avatar");
    return res.status(201).json(new ApiResponse(201, result, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;
    if (!mongoose.isValidObjectId(commentId)) throw new ApiError(400, "Invalid comment ID");
    if (!content?.trim()) throw new ApiError(400, "Comment content is required");

    const comment = await Comment.findOneAndUpdate(
        { _id: commentId, owner: req.user._id },
        { $set: { content: content.trim() } },
        { new: true, runValidators: true }
    ).populate("owner", "fullName username avatar");

    if (!comment) throw new ApiError(404, "Comment not found or you are not its owner");
    return res.status(200).json(new ApiResponse(200, comment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    if (!mongoose.isValidObjectId(commentId)) throw new ApiError(400, "Invalid comment ID");

    const comment = await Comment.findOneAndDelete({ _id: commentId, owner: req.user._id });
    if (!comment) throw new ApiError(404, "Comment not found or you are not its owner");

    return res.status(200).json(new ApiResponse(200, comment, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };