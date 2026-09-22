const path = require('path');

const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const SWAGGER_FILE = path.join(__dirname, '..', '..', 'swagger.yaml');
const swaggerDocument = YAML.load(SWAGGER_FILE);

const router = express.Router();

// Raw spec, useful for importing into Postman or another client.
router.get('/swagger.yaml', (req, res) => {
  res.type('text/yaml').sendFile(SWAGGER_FILE);
});

// Interactive Swagger UI.
router.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

module.exports = router;
