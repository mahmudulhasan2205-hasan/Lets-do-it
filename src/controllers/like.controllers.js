import mongoose from "mongoose";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/Apiresponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleLike = async (Model, field, itemId, userId) => {
    if (!mongoose.isValidObjectId(itemId)) throw new ApiError(400, `Invalid ${field} ID`);

    const item = await Model.findById(itemId).select("_id");
    if (!item) throw new ApiError(404, `${field} not found`);

    const filter = { [field]: itemId, likedBy: userId };
    const existingLike = await Like.findOne(filter);

    if (existingLike) {
        await Like.deleteOne({ _id: existingLike._id });
        return { liked: false };
    }

    await Like.create(filter);
    return { liked: true };
};

const toggleVideoLike = asyncHandler(async (req, res) => {
    const result = await toggleLike(Video, "video", req.params.videoId, req.user._id);
    return res.status(200).json(new ApiResponse(200, result, result.liked ? "Video liked" : "Video unliked"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const result = await toggleLike(Comment, "comment", req.params.commentId, req.user._id);
    return res.status(200).json(new ApiResponse(200, result, result.liked ? "Comment liked" : "Comment unliked"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const result = await toggleLike(Tweet, "tweet", req.params.tweetId, req.user._id);
    return res.status(200).json(new ApiResponse(200, result, result.liked ? "Tweet liked" : "Tweet unliked"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const likes = await Like.find({ likedBy: req.user._id, video: { $exists: true } })
        .populate({
            path: "video",
            match: { isPublished: true },
            populate: { path: "owner", select: "fullName username avatar" }
        })
        .sort({ createdAt: -1 });

    const videos = likes.map((like) => like.video).filter(Boolean);
    return res.status(200).json(new ApiResponse(200, videos, "Liked videos fetched successfully"));
});

export { toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos };