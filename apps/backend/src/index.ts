import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: config.CLIENT_URL,
    credentials: true
  })
);
app.use(express.json());
app.use(morgan(config.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/health', (_request, response) => {
  response.json({
    status: 'ok',
    service: 'edumatch-api'
  });
});

app.get('/api/meta', (_request, response) => {
  response.json({
    name: 'EduMatch API',
    version: '0.1.0',
    plannedModules: ['auth', 'profiles', 'projects', 'join-requests', 'project-chat']
  });
});

const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({
    message: 'Internal server error'
  });
};

app.use(errorHandler);

app.listen(config.PORT, () => {
  console.log(`EduMatch API is running on http://localhost:${config.PORT}`);
});
