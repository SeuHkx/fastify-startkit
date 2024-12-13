FROM ubuntu:latest
LABEL authors="hkx"

ENTRYPOINT ["top", "-b"]