#!/bin/sh

set -xe

docker-compose -f docker/cors_proxy/docker-compose.yml up -d
