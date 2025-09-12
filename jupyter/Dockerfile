FROM jupyter/datascience-notebook

USER root

# ワークディレクトリの権限を設定
RUN mkdir -p /work && \
    chown -R jovyan:users /work && \
    chmod -R 755 /work

USER jovyan

RUN pip install --upgrade pip && \
    pip install mlflow