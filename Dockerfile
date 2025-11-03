# Use an official Node.js runtime as a parent image
FROM node:18-slim

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install any needed packages
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Make port 9002 available to the world outside this container
EXPOSE 9002

# Define the command to run your app
CMD ["npm", "run", "dev"]
