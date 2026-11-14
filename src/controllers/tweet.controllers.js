import mongoose from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/Apiresponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    if (!content?.trim()) throw new ApiError(400, "Tweet content is required");

    const tweet = await Tweet.create({ content: content.trim(), owner: req.user._id });
    return res.status(201).json(new ApiResponse(201, tweet, "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    if (!mongoose.isValidObjectId(userId)) throw new ApiError(400, "Invalid user ID");

    const tweets = await Tweet.find({ owner: userId })
        .populate("owner", "fullName username avatar")
        .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, tweets, "User tweets fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;
    if (!mongoose.isValidObjectId(tweetId)) throw new ApiError(400, "Invalid tweet ID");
    if (!content?.trim()) throw new ApiError(400, "Tweet content is required");

    const tweet = await Tweet.findOneAndUpdate(
        { _id: tweetId, owner: req.user._id },
        { $set: { content: content.trim() } },
        { new: true, runValidators: true }
    );

    if (!tweet) throw new ApiError(404, "Tweet not found or you are not its owner");
    return res.status(200).json(new ApiResponse(200, tweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    if (!mongoose.isValidObjectId(tweetId)) throw new ApiError(400, "Invalid tweet ID");

    const tweet = await Tweet.findOneAndDelete({ _id: tweetId, owner: req.user._id });
    if (!tweet) throw new ApiError(404, "Tweet not found or you are not its owner");

    return res.status(200).json(new ApiResponse(200, tweet, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };