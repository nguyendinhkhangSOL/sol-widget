FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
EXPOSE 5174

# Build production + serve via vite preview.
# Lý do: Vite dev mode có TTY/stdin issue trong Docker (Vite v5 bind stdin
# để bắt phím tắt b/w/d). preview mode KHÔNG bind stdin → stable.
# Trade-off: mất hot-reload, nhưng test pilot OK.
#
# VITE_BASE=/ override default '/app/' (cho Firebase Hosting subpath).
# Container serve at root → cần base '/' để asset path đúng.
ENV VITE_BASE=/
RUN npm run build
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5174"]
