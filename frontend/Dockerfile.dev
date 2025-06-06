FROM node:23

WORKDIR /app

COPY . /app/

RUN npm install
RUN npm run build

EXPOSE ${FRONTEND_PORT:-5173}

CMD ["sh", "-c", "npm run dev -- --port ${FRONTEND_PORT:-5173}"]
