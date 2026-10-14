FROM mcr.microsoft.com/playwright:v1.64.1-noble

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=4317
ENV HOSTNAME=0.0.0.0
ENV PLAYWRIGHT_CHROMIUM_SANDBOX=0
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV CV_DOCS_DIR=/app/data/cv/docs

RUN corepack enable && corepack prepare pnpm@10.26.2 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY web/package.json web/
RUN pnpm install --frozen-lockfile

COPY src src
COPY web web
COPY data/cv/docs data/cv/docs
COPY tsconfig.json ./

RUN pnpm --filter cv-proof build \
  && mkdir -p web/.next/standalone/web/.next \
  && cp -R web/.next/static web/.next/standalone/web/.next/static

EXPOSE 4317

CMD ["node", "web/.next/standalone/web/server.js"]
