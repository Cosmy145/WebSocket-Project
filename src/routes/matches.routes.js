import { Router } from "express";
import {getAllMatches, createMatch} from "../controllers/matches.controller.js";

const router = Router();

router.route("/").get(getAllMatches).post(createMatch);

export default router;