#!/bin/bash

echo "Starting Ollama server..."
ollama serve & # Start Ollama in the background

echo "Waiting for Ollama server to be active..."
while [ "$(ollama list | grep 'NAME')" == "" ]; do
  sleep 1
done

echo "Ollama is ready, pulling the model ..."
ollama pull llama3.2

while true; do
  sleep 1
done