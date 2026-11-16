import { Router } from "express";
import {
  enquiryListQuerySchema,
  idParamSchema,
  updateEnquirySchema,
} from "@nezx/shared";

import { requireAdmin } from "../../middleware/auth.js";
import { getEnquiryStats, listEnquiries, updateEnquiry } from "./enquiry-admin.service.js";

export const adminEnquiryRouter = Router();

adminEnquiryRouter.use("/admin", requireAdmin);

adminEnquiryRouter.get("/admin/enquiries", async (req, res) => {
  const query = enquiryListQuerySchema.parse(req.query);
  res.json(await listEnquiries(query));
});

adminEnquiryRouter.get("/admin/enquiries/stats", async (_req, res) => {
  res.json(await getEnquiryStats());
});

adminEnquiryRouter.patch("/admin/enquiries/:id", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const input = updateEnquirySchema.parse(req.body);
  res.json(await updateEnquiry(id, input));
});
