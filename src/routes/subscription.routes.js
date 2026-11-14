import { Router } from "express";
import {
    toggleSubscription, getUserChannelSubscribers, getSubscribedChannels
} from "../controllers/subscription.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/channel/:channelId")
    .post(verifyJWT, toggleSubscription)
    .get(getUserChannelSubscribers);
router.route("/user/:subscriberId").get(getSubscribedChannels);

export default router;