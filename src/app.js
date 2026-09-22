const express = require('express');

const apiRoutes = require('./routes');
const docsRoutes = require('./routes/docsRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

app.use(express.json());

// Interactive API documentation.
app.use('/api-docs', docsRoutes);

// Business endpoints.
app.use('/api', apiRoutes);

// Anything else is a 404, and every error is rendered by one handler.
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
