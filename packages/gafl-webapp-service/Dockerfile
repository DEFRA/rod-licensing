####################################################################################################################################
# Build stage 1 - Create a distribution of the project which we can copy in the second build stage.
####################################################################################################################################
FROM rod_licensing/builder AS builder
WORKDIR /app

# Install app dependencies
COPY packages/gafl-webapp-service/package*.json /app/
COPY packages/gafl-webapp-service/assets /app/assets
COPY packages/gafl-webapp-service/build /app/build

RUN npm install && npm run prepare

# Bundle app source
COPY packages/gafl-webapp-service/ /app

RUN rm -Rf /app/build /app/assets

####################################################################################################################################
# Build stage 2 - Using the distribution from stage 1, build the final docker image with a minimal number of layers.
####################################################################################################################################
FROM rod_licensing/base
WORKDIR /app
COPY --from=builder --chown=node:node /app/ /app/

# Create a destination directory for the rebrand assets
RUN mkdir -p /app/public/assets/rebrand

# Copy rebrand assets to detination directory
COPY --from=builder \
     /app/node_modules/govuk-frontend/dist/govuk/assets/rebrand \
     /app/public/assets/rebrand

RUN npm prune --production && npm cache clean --force > /dev/null 2>&1

# Default service port
ARG PORT=3000

EXPOSE ${PORT}
ENTRYPOINT [ "pm2-runtime", "ecosystem.config.yml" ]
