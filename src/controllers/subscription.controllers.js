import mongoose from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/Apiresponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const subscriberId = req.user._id;

    if (!mongoose.isValidObjectId(channelId)) throw new ApiError(400, "Invalid channel ID");
    if (subscriberId.toString() === channelId) {
        throw new ApiError(400, "You cannot subscribe to your own channel");
    }

    const channel = await User.findById(channelId).select("_id");
    if (!channel) throw new ApiError(404, "Channel not found");

    const existingSubscription = await Subscription.findOne({
        subscriber: subscriberId,
        channel: channelId
    });

    if (existingSubscription) {
        await Subscription.deleteOne({ _id: existingSubscription._id });
        return res.status(200).json(
            new ApiResponse(200, { subscribed: false }, "Channel unsubscribed successfully")
        );
    }

    await Subscription.create({ subscriber: subscriberId, channel: channelId });
    return res.status(200).json(
        new ApiResponse(200, { subscribed: true }, "Channel subscribed successfully")
    );
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    if (!mongoose.isValidObjectId(channelId)) throw new ApiError(400, "Invalid channel ID");

    const channel = await User.findById(channelId).select("_id");
    if (!channel) throw new ApiError(404, "Channel not found");

    const subscribers = await Subscription.find({ channel: channelId })
        .populate("subscriber", "fullName username avatar")
        .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, subscribers, "Channel subscribers fetched"));
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;
    if (!mongoose.isValidObjectId(subscriberId)) throw new ApiError(400, "Invalid subscriber ID");

    const user = await User.findById(subscriberId).select("_id");
    if (!user) throw new ApiError(404, "User not found");

    const channels = await Subscription.find({ subscriber: subscriberId })
        .populate("channel", "fullName username avatar")
        .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, channels, "Subscribed channels fetched"));
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };