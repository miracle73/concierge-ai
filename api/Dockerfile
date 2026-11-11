FROM rust:1.82 AS build
WORKDIR /app
COPY . .
RUN cargo build --release
FROM debian:bookworm-slim
COPY --from=build /app/target/release/concierge-api /usr/local/bin/
EXPOSE 8080
CMD ["concierge-api"]
