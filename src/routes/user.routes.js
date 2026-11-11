import { Router } from "express";
import {registerUser} from "../controllers/user.controllers.js";
import{upload} from "../middlewears/multer.middlewear.js";

const router = Router();

router.route("/register").post(registerUser)

upload.fields([
    {name: "avatar",
        maxCount: 1
    },
    {name: "coverImage",
        maxCount: 1
    },

])

export default router;