import { Router } from "express";
import {
    toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos
} from "../controllers/like.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/videos").get(verifyJWT, getLikedVideos);
router.route("/videos/:videoId").post(verifyJWT, toggleVideoLike);
router.route("/comments/:commentId").post(verifyJWT, toggleCommentLike);
router.route("/tweets/:tweetId").post(verifyJWT, toggleTweetLike);

export default router;