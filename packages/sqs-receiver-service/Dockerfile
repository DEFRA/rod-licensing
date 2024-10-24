####################################################################################################################################
# Build stage 1 - Create a distribution of the project which we can copy in the second build stage.
####################################################################################################################################
FROM rod_licensing/builder AS builder
WORKDIR /app

# Install app dependencies
COPY packages/sqs-receiver-service/package*.json /app/
RUN npm ci --production && npm cache clean --force > /dev/null 2>&1

# Bundle app source
COPY packages/sqs-receiver-service/ /app

####################################################################################################################################
# Build stage 2 - Using the distribution from stage 1, build the final docker image with a minimal number of layers.
####################################################################################################################################
FROM rod_licensing/base
WORKDIR /app
COPY --from=builder /app/ /app/

ENTRYPOINT [ "pm2-runtime", "ecosystem.config.yml" ]
