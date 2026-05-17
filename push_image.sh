#!/bin/bash
# Push TaskFlow Unified Docker Image to Docker Hub

# Exit on any error
set -e

DOCKER_USER="nirmal08"
IMAGE_NAME="taskflow-app"
TAG="latest"

echo "========================================="
echo "Tagging & Pushing TaskFlow Docker Image"
echo "========================================="

# Check if user is logged in
echo "Checking Docker authentication..."
if ! docker info | grep -q "Username"; then
    echo "🔑 You must be logged in to Docker Hub first."
    echo "Running 'docker login'..."
    docker login
fi

# Build and push target AMD64 image using Buildx
echo "🏗️ Building and pushing linux/amd64 image to Docker Hub (${DOCKER_USER}/${IMAGE_NAME}:${TAG})..."
docker buildx build --platform linux/amd64 -t ${DOCKER_USER}/${IMAGE_NAME}:${TAG} --push .

echo "========================================="
echo " Success! Image is live on Docker Hub!"
echo " https://hub.docker.com/r/${DOCKER_USER}/${IMAGE_NAME}"
echo "========================================="
