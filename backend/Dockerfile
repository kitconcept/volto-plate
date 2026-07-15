# syntax=docker/dockerfile:1
ARG PLONE_VERSION=6.2.1
FROM plone/server-builder:${PLONE_VERSION} AS builder

WORKDIR /app


# Add local code
COPY scripts/ scripts/
COPY . src

# Install local requirements and pre-compile mo files
RUN <<EOT
    set -e
    bin/pip install mxdev uv
    sed -i 's/-e .\[test\]/./g' src/mx.ini
    cd /app/src
    # remove potentially existing virtualenv from local build
    rm -rf .venv
    ../bin/mxdev -c mx.ini
    ../bin/uv pip install -r requirements-mxdev.txt
    # Add OpenTelemetry support
    ../bin/uv pip install git+https://github.com/collective/collective.opentelemetry.git@5c41a13035a30d880ccbc772c2b3abbc45342c59
    ../bin/python /compile_mo.py
    mv container/docker-entrypoint.sh /app
    mv container/zope-otel.ini /app/etc/
EOT

FROM plone/server-prod-config:${PLONE_VERSION}

LABEL maintainer="kitconcept GmbH <info@kitconcept.com>" \
      org.label-schema.name="volto-plate-backend" \
      org.label-schema.description="Volto Plate backend image." \
      org.label-schema.vendor="kitconcept GmbH"

# Copy /app from builder
COPY --from=builder /app /app

RUN <<EOT
    set -e
    ln -s /data /app/var
EOT
