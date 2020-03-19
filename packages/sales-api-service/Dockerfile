####################################################################################################################################
# Build stage 1 - Create a distribution of the project which we can copy in the second build stage.
####################################################################################################################################
FROM rod-licencing/builder AS builder
WORKDIR /app

# Install app dependencies
COPY package*.json /app/
RUN npm install --production

# Bundle app source
COPY . /app

####################################################################################################################################
# Build stage 2 - Using the distribution from stage 1, build the final docker image with a minimal number of layers.
####################################################################################################################################

FROM rod-licencing/base
WORKDIR /app
COPY --from=builder /app/ /app/

# Default service port
ARG PORT=4000

# Configure health check
HEALTHCHECK --interval=5m --timeout=3s CMD curl -f http://localhost:${PORT}/service-status || exit 1

EXPOSE ${PORT}
ENTRYPOINT [ "pm2-runtime", "src/sales-api-service.js" ]
