FROM nginx:alpine

COPY index.html style.css script.js /usr/share/nginx/html/
COPY img/ /usr/share/nginx/html/img/

EXPOSE 80
