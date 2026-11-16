import { Router } from "express";
import {
  createMediaSchema,
  idParamSchema,
  presignUploadSchema,
  updateMediaSchema,
} from "@nezx/shared";

import { requireAdmin } from "../../middleware/auth.js";
import {
  createMedia,
  deleteMedia,
  listAdminMedia,
  presignUpload,
  updateMedia,
} from "./media.service.js";

export const adminMediaRouter = Router();

adminMediaRouter.use("/admin", requireAdmin);

adminMediaRouter.get("/admin/media", async (_req, res) => {
  res.json({ items: await listAdminMedia() });
});

adminMediaRouter.post("/admin/media", async (req, res) => {
  const input = createMediaSchema.parse(req.body);
  res.status(201).json(await createMedia(input));
});

adminMediaRouter.patch("/admin/media/:id", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const input = updateMediaSchema.parse(req.body);
  res.json(await updateMedia(id, input));
});

adminMediaRouter.delete("/admin/media/:id", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  await deleteMedia(id);
  res.status(204).end();
});

adminMediaRouter.post("/admin/uploads/presign", async (req, res) => {
  const input = presignUploadSchema.parse(req.body);
  res.json(await presignUpload(input));
});
