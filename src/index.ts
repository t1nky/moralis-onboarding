import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { getAssetsByAddress } from "./getAssetsByAddress.js";

const app = new Hono();

app.get("/nfts/:address", async (ctx) => {
  const address = ctx.req.param("address");
  const result = await getAssetsByAddress(address);
  return ctx.json(result);
});

app.onError((err, ctx) => {
  console.error(err);
  if (err instanceof HTTPException) {
    return ctx.json({ message: err.message }, err.status);
  }
  return ctx.json({ message: "Internal Server Error" }, 500);
});

app.notFound((c) => c.json({ message: "Not Found" }, 404));

serve(app);
