# syntax=docker/dockerfile:1
ARG base_image=nvidia/cuda:11.4.2-cudnn8-devel-ubuntu20.04
FROM ${base_image}

ARG miniconda_version="4.9.2"
ARG miniconda_checksum="122c8c9beb51e124ab32a0fa6426c656"
ARG conda_version="4.9.2"
ARG PYTHON_VERSION=default

ENV APP_DIR="/app"
ENV DEFAULT_CONDA_ENV_NAME="visualizer"
ENV APP_PORT=8080

ENV CONDA_DIR=/opt/conda \
    SHELL=/bin/bash \
    LANG=en_US.UTF-8 \
    LANGUAGE=en_US.UTF-8
ENV PATH=$CONDA_DIR/bin:$PATH

ENV MINICONDA_VERSION="${miniconda_version}" \
    CONDA_VERSION="${conda_version}"

# General OS dependencies 
ENV DEBIAN_FRONTEND noninteractive
RUN apt-get update \
 && apt-get install -yq --no-install-recommends \
    wget \
    apt-utils \
    unzip \
    bzip2 \
    ca-certificates \
    sudo \
    locales \
    fonts-liberation \
    unattended-upgrades \
    run-one \
    nano \
    libgl1-mesa-glx \
 && apt-get clean && rm -rf /var/lib/apt/lists/*

# Miniconda installation
WORKDIR /tmp
RUN wget --quiet https://repo.continuum.io/miniconda/Miniconda3-py38_${MINICONDA_VERSION}-Linux-x86_64.sh && \
    echo "${miniconda_checksum} *Miniconda3-py38_${MINICONDA_VERSION}-Linux-x86_64.sh" | md5sum -c - && \
    /bin/bash Miniconda3-py38_${MINICONDA_VERSION}-Linux-x86_64.sh -f -b -p $CONDA_DIR && \
    rm Miniconda3-py38_${MINICONDA_VERSION}-Linux-x86_64.sh && \
    # Conda configuration see https://conda.io/projects/conda/en/latest/configuration.html
    echo "conda ${CONDA_VERSION}" >> $CONDA_DIR/conda-meta/pinned && \
    conda install --quiet --yes "conda=${CONDA_VERSION}" && \
    conda install --quiet --yes pip && \
    conda update --all --quiet --yes && \
    conda clean --all -f -y

EXPOSE ${APP_PORT}
WORKDIR ${APP_DIR}
ADD . ${APP_DIR}

RUN apt update && apt install software-properties-common -y
RUN apt update && add-apt-repository ppa:ubuntugis/ppa -y
RUN apt-get update && apt-get install gdal-bin libgdal-dev -y
RUN export CPLUS_INCLUDE_PATH=/usr/include/gdal
RUN export C_INCLUDE_PATH=/usr/include/gdal
RUN apt-get install python3-gdal 

RUN /opt/conda/bin/conda init bash
RUN conda config --set channel_priority strict
RUN conda env create --file environment.yml -n ${DEFAULT_CONDA_ENV_NAME}
RUN . activate ${DEFAULT_CONDA_ENV_NAME}
RUN python --version

ENV CONDA_DEFAULT_ENV ${DEFAULT_CONDA_ENV_NAME}
RUN echo "source activate ${DEFAULT_CONDA_ENV_NAME}" > ~/.bashrc
ENV PATH /opt/conda/envs/${DEFAULT_CONDA_ENV_NAME}/bin:$PATH

