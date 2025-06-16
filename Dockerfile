# Build stage
FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Copy config files
COPY .eslintrc.cjs postcss.config.cjs preinstall.cjs prepare.cjs tailwind.config.cjs ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build without TypeScript check (skip tsc)
RUN yarn vite build

# Production stage
FROM nginx:alpine

# Copy built files to nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 4200
EXPOSE 4200

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
