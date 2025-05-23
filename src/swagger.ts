import { Express, Request, Response } from "express";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { version } from "../package.json";

const options: swaggerJsDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "VLAD API",
      version,
      description: "API documentation for VLAD project",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    servers: [
      {
        url: `http://localhost:${process.env.PORT}`,
      },
    ],
  },
  apis: ["./src/routes/*.ts", "./src/model/*.ts"],
};

const swaggerDocs = swaggerJsDoc(options);

export default function swaggerDocsMiddleware(app: Express, port: string) {
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
  app.get("/api/docs.json", (req: Request, res: Response) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerDocs);
  });
  console.log(`Swagger docs available at http://localhost:${port}/api/docs`);
}
