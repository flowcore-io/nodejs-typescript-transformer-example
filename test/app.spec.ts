import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import axios from "axios";
import { faker } from "@faker-js/faker";
import { TransformData } from "./fixtures/dtos/transform-data.dto";
import { FLOWCORE_CONSTANT_TIME_BUCKET_FORMAT } from "./fixtures/constants";
import _ from "lodash";
import express from "express";
import { Server } from "http";
import { TransformerBlueprint } from "./fixtures/dtos/transformer-blueprint.dto";

dayjs.extend(utc);

const TRANSFORMER_BLUEPRINT: TransformerBlueprint = {
  name: "test-transformer",
  version: "1.0.0",
  runtime: "node",
  artifactUrl: "/app/transformers/test-transformer",
  entrypoint: "server.js",
  startTimeTimeout: 10000,
} as TransformerBlueprint;

describe("NodeJS Test Transformer (e2e)", () => {
  jest.setTimeout(1000000);
  const listeners = new Map<string, jest.MockedFn<any>>();
  const app = express();
  let server: Server;
  let processId: string;

  beforeAll(async () => {
    app.use(express.json());

    app.post("/store/:name", (req, res) => {
      console.log("Received payload", req.params.name, req.body);
      listeners.get(req.params.name)!(req.body);
      res.status(201).send();
    });

    server = app.listen(3002, () => {
      console.log(`Receiver started on port 3002`);
    });

    const axiosResponse = await axios.post(
      "http://localhost:3001/load",
      TRANSFORMER_BLUEPRINT,
    );

    expect(axiosResponse.data.processId).toBeDefined();

    processId = axiosResponse.data.processId;
  });

  it("should load and process data through a transformer", async () => {
    const receiverName = _.kebabCase(faker.word.noun().toLowerCase());
    const jestFn = jest.fn();
    listeners.set(receiverName, jestFn);

    const eventTime = dayjs.utc(faker.date.recent());
    const data: TransformData = {
      destination: `http://${process.env.HOST_ADDRESS}:3002/store/${receiverName}`,
      definition: {
        hello: "world",
      },
      event: {
        eventId: faker.string.uuid(),
        dataCore: faker.string.uuid(),
        eventType: faker.word.noun(),
        aggregator: faker.word.adjective(),
        timeBucket: eventTime.format(FLOWCORE_CONSTANT_TIME_BUCKET_FORMAT),
        validTime: eventTime.toISOString(),
        serializedPayload: JSON.stringify({
          hello: "world",
        }),
      },
    };

    const processedResult = await axios.post(
      "http://localhost:3001/transform/" + processId,
      data,
    );

    expect(processedResult.status).toEqual(200);

    expect(jestFn).toHaveBeenCalledWith(
      expect.objectContaining({
        definition: data.definition,
        value: {
          eventId: data.event.eventId,
          validTime: data.event.validTime,
          ...JSON.parse(data.event.serializedPayload),
        },
      }),
    );
  });

  afterAll(async () => {
    await axios.post("http://localhost:3001/unload/" + processId);
    server.close();
  });
});
