####################################################################################################################################
# Build stage 1 - Create a distribution of the project which we can copy in the second build stage.
####################################################################################################################################
FROM rod_licensing/builder AS builder
WORKDIR /app

# Install app dependencies
COPY packages/sales-api-service/package*.json /app/
RUN npm install --production && npm cache clean --force > /dev/null 2>&1

# Bundle app source
COPY packages/sales-api-service/ /app

####################################################################################################################################
# Build stage 2 - Using the distribution from stage 1, build the final docker image with a minimal number of layers.
####################################################################################################################################
FROM rod_licensing/base
WORKDIR /app
COPY --from=builder /app/ /app/

# Default service port
ARG PORT=4000

EXPOSE ${PORT}
ENTRYPOINT [ "pm2-runtime", "ecosystem.config.yml" ]
