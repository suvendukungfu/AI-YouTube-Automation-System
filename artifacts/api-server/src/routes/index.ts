import { Router, type IRouter } from "express";
import healthRouter from "./health";
import channelsRouter from "./channels";
import videosRouter from "./videos";
import nichesRouter from "./niches";
import scheduleRouter from "./schedule";
import earningsRouter from "./earnings";
import jobsRouter from "./jobs";
import contentRouter from "./content";
import ttsRouter from "./tts";
import visualsRouter from "./visuals";
import subtitlesRouter from "./subtitles";
import renderRouter from "./render";
import thumbnailsRouter from "./thumbnails";
import youtubeRouter from "./youtube";
import pipelineRouter from "./pipeline";
import schedulerRouter from "./scheduler";

const router: IRouter = Router();

router.use(healthRouter);
router.use(channelsRouter);
router.use(videosRouter);
router.use(nichesRouter);
router.use(scheduleRouter);
router.use(earningsRouter);
router.use(jobsRouter);
router.use(contentRouter);
router.use(ttsRouter);
router.use(visualsRouter);
router.use(subtitlesRouter);
router.use(renderRouter);
router.use(thumbnailsRouter);
router.use(youtubeRouter);
router.use(pipelineRouter);
router.use(schedulerRouter);

export default router;
