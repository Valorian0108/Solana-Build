import { Router, type IRouter } from "express";
import healthRouter from "./health";
import creatorsRouter from "./creators";
import tipsRouter from "./tips";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(creatorsRouter);
router.use(tipsRouter);
router.use(statsRouter);

export default router;
