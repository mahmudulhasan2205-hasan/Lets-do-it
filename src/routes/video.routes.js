import { Router } from "express";
import {
    publishVideo, getAllVideos, getVideoById, updateVideo,
    deleteVideo, togglePublishStatus
} from "../controllers/video.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/").get(getAllVideos).post(
    verifyJWT,
    upload.fields([
        { name: "videoFile", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 }
    ]),
    publishVideo
);
router.route("/:videoId")
    .get(getVideoById)
    .patch(verifyJWT, upload.single("thumbnail"), updateVideo)
    .delete(verifyJWT, deleteVideo);
router.route("/:videoId/toggle-publish").patch(verifyJWT, togglePublishStatus);

export default router;