####################################################################################################################################
# Build stage 1 - Create a distribution of the project which we can copy in the second build stage.
####################################################################################################################################
FROM rod_licensing/builder AS builder
WORKDIR /app

# Install app dependencies
COPY packages/payment-mop-up-job/package*.json /app/
RUN rm -rf node_modules
RUN npm install --package-lock-only  --production
RUN npm install --production && npm cache clean --force > /dev/null 2>&1

# Bundle app source
COPY packages/payment-mop-up-job/ /app

####################################################################################################################################
# Build stage 2 - Using the distribution from stage 1, build the final docker image with a minimal number of layers.
####################################################################################################################################
FROM rod_licensing/base
WORKDIR /app
COPY --from=builder /app/ /app/

# Use node directly rather than pm2 for scheduled tasks
ENTRYPOINT [ "node", "--unhandled-rejections=strict", "src/payment-mop-up-job.js" ]
