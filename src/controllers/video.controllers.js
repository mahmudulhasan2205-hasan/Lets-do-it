import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/Apiresponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const publishVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    const videoPath = req.files?.videoFile?.[0]?.path;
    const thumbnailPath = req.files?.thumbnail?.[0]?.path;

    if (!title?.trim() || !description?.trim()) {
        throw new ApiError(400, "Title and description are required");
    }
    if (!videoPath || !thumbnailPath) {
        throw new ApiError(400, "Video file and thumbnail are required");
    }

    const [videoUpload, thumbnailUpload] = await Promise.all([
        uploadOnCloudinary(videoPath),
        uploadOnCloudinary(thumbnailPath)
    ]);

    if (!videoUpload?.url || !thumbnailUpload?.url) {
        throw new ApiError(500, "Video or thumbnail upload failed");
    }

    const video = await Video.create({
        videoFile: videoUpload.url,
        thumbnail: thumbnailUpload.url,
        title: title.trim(),
        description: description.trim(),
        duration: Number(videoUpload.duration) || 0,
        owner: req.user._id
    });

    return res.status(201).json(
        new ApiResponse(201, video, "Video published successfully")
    );
});

const getAllVideos = asyncHandler(async (req, res) => {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 100);
    const search = req.query.search?.trim();

    const filter = { isPublished: true };
    if (search) filter.title = { $regex: search, $options: "i" };

    const [videos, totalVideos] = await Promise.all([
        Video.find(filter)
            .populate("owner", "fullName username avatar")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit),
        Video.countDocuments(filter)
    ]);

    return res.status(200).json(new ApiResponse(200, {
        videos,
        page,
        limit,
        totalVideos,
        totalPages: Math.ceil(totalVideos / limit)
    }, "Videos fetched successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!mongoose.isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID");

    const video = await Video.findOneAndUpdate(
        { _id: videoId, isPublished: true },
        { $inc: { views: 1 } },
        { new: true }
    ).populate("owner", "fullName username avatar");

    if (!video) throw new ApiError(404, "Video not found");

    return res.status(200).json(new ApiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;

    if (!mongoose.isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID");

    const video = await Video.findOne({ _id: videoId, owner: req.user._id });
    if (!video) throw new ApiError(404, "Video not found or you are not its owner");

    if (title !== undefined) {
        if (!title.trim()) throw new ApiError(400, "Title cannot be empty");
        video.title = title.trim();
    }
    if (description !== undefined) {
        if (!description.trim()) throw new ApiError(400, "Description cannot be empty");
        video.description = description.trim();
    }

    const thumbnailPath = req.file?.path;
    if (thumbnailPath) {
        const thumbnailUpload = await uploadOnCloudinary(thumbnailPath);
        if (!thumbnailUpload?.url) throw new ApiError(500, "Thumbnail upload failed");
        video.thumbnail = thumbnailUpload.url;
    }

    await video.save();
    return res.status(200).json(new ApiResponse(200, video, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!mongoose.isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID");

    const video = await Video.findOneAndDelete({ _id: videoId, owner: req.user._id });
    if (!video) throw new ApiError(404, "Video not found or you are not its owner");

    return res.status(200).json(new ApiResponse(200, video, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!mongoose.isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID");

    const video = await Video.findOne({ _id: videoId, owner: req.user._id });
    if (!video) throw new ApiError(404, "Video not found or you are not its owner");

    video.isPublished = !video.isPublished;
    await video.save();

    return res.status(200).json(new ApiResponse(200, video, "Video publish status changed"));
});

export {
    publishVideo,
    getAllVideos,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
};