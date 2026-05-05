# Use the official Node.js image as the base image
FROM node:latest
# create a working directory
WORKDIR /app 
# copy package.json to the working directory
COPY package.json ./
# install dependencies
RUN npm install
# copy the rest of the application code to the working directory
COPY . .
# expose the port the app runs on
EXPOSE 3000
# start the application
CMD ["npm", "start"]