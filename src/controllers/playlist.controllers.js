import mongoose from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/Apiresponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    if (!name?.trim() || !description?.trim()) {
        throw new ApiError(400, "Playlist name and description are required");
    }

    const playlist = await Playlist.create({
        name: name.trim(),
        description: description.trim(),
        owner: req.user._id
    });

    return res.status(201).json(new ApiResponse(201, playlist, "Playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    if (!mongoose.isValidObjectId(userId)) throw new ApiError(400, "Invalid user ID");

    const playlists = await Playlist.find({ owner: userId })
        .populate("owner", "fullName username avatar")
        .select("-videos")
        .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, playlists, "Playlists fetched successfully"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    if (!mongoose.isValidObjectId(playlistId)) throw new ApiError(400, "Invalid playlist ID");

    const playlist = await Playlist.findById(playlistId)
        .populate("owner", "fullName username avatar")
        .populate({
            path: "videos",
            match: { isPublished: true },
            populate: { path: "owner", select: "fullName username avatar" }
        });

    if (!playlist) throw new ApiError(404, "Playlist not found");
    return res.status(200).json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;
    if (!mongoose.isValidObjectId(playlistId)) throw new ApiError(400, "Invalid playlist ID");
    if (name === undefined && description === undefined) {
        throw new ApiError(400, "Provide a playlist name or description to update");
    }

    const update = {};
    if (name !== undefined) {
        if (!name.trim()) throw new ApiError(400, "Playlist name cannot be empty");
        update.name = name.trim();
    }
    if (description !== undefined) {
        if (!description.trim()) throw new ApiError(400, "Description cannot be empty");
        update.description = description.trim();
    }

    const playlist = await Playlist.findOneAndUpdate(
        { _id: playlistId, owner: req.user._id },
        { $set: update },
        { new: true, runValidators: true }
    );
    if (!playlist) throw new ApiError(404, "Playlist not found or you are not its owner");

    return res.status(200).json(new ApiResponse(200, playlist, "Playlist updated successfully"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    if (!mongoose.isValidObjectId(playlistId)) throw new ApiError(400, "Invalid playlist ID");

    const playlist = await Playlist.findOneAndDelete({ _id: playlistId, owner: req.user._id });
    if (!playlist) throw new ApiError(404, "Playlist not found or you are not its owner");

    return res.status(200).json(new ApiResponse(200, playlist, "Playlist deleted successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    if (!mongoose.isValidObjectId(playlistId) || !mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID");
    }

    const [playlist, video] = await Promise.all([
        Playlist.findOne({ _id: playlistId, owner: req.user._id }),
        Video.findOne({ _id: videoId, isPublished: true })
    ]);

    if (!playlist) throw new ApiError(404, "Playlist not found or you are not its owner");
    if (!video) throw new ApiError(404, "Video not found");

    await Playlist.updateOne(
        { _id: playlistId, owner: req.user._id },
        { $addToSet: { videos: videoId } }
    );

    const updatedPlaylist = await Playlist.findById(playlistId).populate("videos");
    return res.status(200).json(new ApiResponse(200, updatedPlaylist, "Video added to playlist"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    if (!mongoose.isValidObjectId(playlistId) || !mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID");
    }

    const playlist = await Playlist.findOneAndUpdate(
        { _id: playlistId, owner: req.user._id },
        { $pull: { videos: videoId } },
        { new: true }
    ).populate("videos");

    if (!playlist) throw new ApiError(404, "Playlist not found or you are not its owner");
    return res.status(200).json(new ApiResponse(200, playlist, "Video removed from playlist"));
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    updatePlaylist,
    deletePlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist
};