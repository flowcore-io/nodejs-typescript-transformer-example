import express, { Request, Response } from "express";
import * as console from "console";

const app = express();

app.use(express.json());

app.get("/health", (req: Request, res: Response): Response => {
  // return 200 if the transformer is healthy, required by the transformer shell
  // no transformations will be performed if the transformer is not healthy
  return res.send("OK");
});

app.post("/transform", (req: Request, res: Response): Response => {
  // transform the payload here, return the transformed payload in the response
  const { eventId, validTime, payload } = req.body;

  console.log("Received2 payload", eventId, validTime, payload);

  return res.send({
    eventId,
    validTime,
    ...payload,
  });
});

const start = async (): Promise<void> => {
  const port = process.env.PORT || 4000;
  try {
    app.listen(port, () => {
      console.log(`Server started on port ${port}`);
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

void start();
