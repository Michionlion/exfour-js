# --- Compile ---
FROM node AS base
WORKDIR /exfour
COPY . /exfour
RUN yarn install
RUN yarn build

# --- Deploy ---
FROM nginx
WORKDIR /srv
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=base /exfour/dist /srv
