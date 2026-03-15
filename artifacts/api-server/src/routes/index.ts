import { Router, type IRouter } from "express";
import healthRouter from "./health";
import channelsRouter from "./channels";
import videosRouter from "./videos";
import nichesRouter from "./niches";
import scheduleRouter from "./schedule";
import earningsRouter from "./earnings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(channelsRouter);
router.use(videosRouter);
router.use(nichesRouter);
router.use(scheduleRouter);
router.use(earningsRouter);

export default router;
