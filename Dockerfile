# --- Compile ---
# FROM node:15.8.0 AS base
# COPY . .
# RUN yarn install --dev
# RUN yarn build

# --- Deploy ---
FROM nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf
# COPY --from=base dist /srv
COPY dist /srv
