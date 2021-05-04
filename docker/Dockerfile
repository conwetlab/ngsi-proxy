ARG NODE_VERSION=16-slim
FROM node:${NODE_VERSION}
ARG GITHUB_ACCOUNT=conwetlab
ARG GITHUB_REPOSITORY=ngsi-proxy
ARG DOWNLOAD=latest
ARG SOURCE_BRANCH=develop

# Copying Build time arguments to environment variables so they are persisted at run time and can be 
# inspected within a running container.
# see: https://vsupalov.com/docker-build-time-env-values/  for a deeper explanation.

ENV GITHUB_ACCOUNT=${GITHUB_ACCOUNT}
ENV GITHUB_REPOSITORY=${GITHUB_REPOSITORY}
ENV DOWNLOAD=${DOWNLOAD}


# The default download is the latest tip of the master of the named repository on GitHub
#
# Alternatively for local development, just copy this Dockerfile into file the root of the repository and 
# replace the whole RUN statement by the following COPY statement in your local source using :
#
# COPY . /opt/ngsi-proxy
#
RUN if [ "${DOWNLOAD}" = "latest" ] ; \
    then \
        RELEASE="${SOURCE_BRANCH}"; \
        echo "INFO: Building Latest Development from ${SOURCE_BRANCH} branch."; \
    elif [ "${DOWNLOAD}" = "stable" ]; \
    then \
        RELEASE=$(curl -s https://api.github.com/repos/"${GITHUB_ACCOUNT}"/"${GITHUB_REPOSITORY}"/releases/latest | grep 'tag_name' | cut -d\" -f4); \
        echo "INFO: Building Latest Stable Release: ${RELEASE}"; \
    else \
        RELEASE="${DOWNLOAD}"; \
        echo "INFO: Building Release: ${RELEASE}"; \
    fi && \
    RELEASE_CONCAT=$(echo "${RELEASE}" | tr / -); \
    # Ensure that unzip and wget are installed, and download the sources
    apt update && \
    apt install -y  --no-install-recommends unzip wget && \
    wget --no-check-certificate -O source.zip https://github.com/"${GITHUB_ACCOUNT}"/"${GITHUB_REPOSITORY}"/archive/"${RELEASE}".zip && \
    unzip source.zip && \
    rm source.zip && \
    mv "${GITHUB_REPOSITORY}-${RELEASE_CONCAT}" /opt/ngsi-proxy && \
    # Remove unzip and wget, and clean apt cache
    apt clean && \
    apt remove -y unzip wget && \
    apt -y autoremove

WORKDIR /opt/ngsi-proxy

RUN \
    # Ensure that Git is installed prior to running npm install
    apt update && \
    apt install -y git && \
    echo "INFO: npm install --production..." && \
    npm install --production && \
    # Remove Git and clean apt cache
    apt clean && \
    apt remove -y git && \
    apt -y autoremove && \
    chmod +x docker/entrypoint.sh && \
    rm -rf /var/lib/apt/lists/*

USER node
ENV NODE_ENV=production

ENTRYPOINT ["docker/entrypoint.sh"]
